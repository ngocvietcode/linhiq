---
id: LIQ-211
title: Reader Summary Slides (AI-generated animated deck)
phase: 2
priority: P1
estimate: 7d
status: Backlog
depends_on: [LIQ-205]
blocks: []
tags: [frontend, backend, ai, content-render, reader]
---

# LIQ-211 — Reader Summary Slides

## Problem

Khi học sinh đọc textbook trong [reader/[subjectId]/page.tsx](../../../apps/web/src/app/reader/[subjectId]/page.tsx) và bấm "Summarize this chapter", AI hiện chỉ trả **text thuần** trong chat panel. Vấn đề:
- Bức tường chữ → học sinh skim, không đọng lại
- Không có cấu trúc visual: thiếu hierarchy, không biết đâu là key takeaway
- Concepts trừu tượng (vd: photosynthesis, supply-demand) cần icon/illustration mới hiểu nhanh
- Không reuse được — học sinh muốn ôn lại phải scroll lên message cũ

Giải pháp: AI sinh **animated slide deck** (3–8 slide) thay text — mỗi slide có layout, màu, icon, animation. Học sinh swipe/auto-play như TikTok carousel hoặc Instagram story → engagement cao hơn nhiều.

Đây không phải Manim video (LIQ-310) — đây là **slide-as-data**: JSON từ AI → React render với Framer Motion. Cheap, nhanh, brand-aligned.

## User story

> Là học sinh IGCSE Biology đang đọc chương "Cell Division", em bấm nút "✨ Summarize as slides". Sau 5 giây, một deck 6 slide hiện ra: slide 1 title "Mitosis vs Meiosis", slide 2 timeline 4 phase với icon từng giai đoạn fade-in, slide 3 so sánh 2 cột màu xanh/đỏ, slide 4 mnemonic "PMAT" với chữ to highlight... Em swipe qua xem, lưu lại để ôn trước thi.

## Acceptance criteria

### Backend
- [ ] Endpoint `POST /reader/summarize-slides { bookId, pageRange|topicId, depth }` → trả `SlideDeck` JSON
- [ ] AI dùng Gemini 2.5 Pro structured output (JSON schema strict mode)
- [ ] Schema validate qua Zod ở `@linhiq/validators` trước khi return
- [ ] RAG context: lấy nội dung từ pages trong range + related `BookPageTopic`
- [ ] Lưu `SlideDeck` vào DB (`SlideDeckSnapshot` table) — user xem lại, share được
- [ ] Rate limit: 10 deck/user/giờ
- [ ] Token cap: input ≤ 10k, output ≤ 4k (force concise)

### Frontend
- [ ] Renderer component `<SlideDeckPlayer deck={deck} />` với 8 layout template
- [ ] Framer Motion entrance animations per block (fade, slide-up, scale, stagger)
- [ ] Auto-play mode (5s/slide) + manual swipe (touch/keyboard arrows)
- [ ] Progress bar dạng story (Instagram-like)
- [ ] Mobile-first: full-screen modal, portrait orientation
- [ ] Desktop: side panel hoặc lightbox 16:9
- [ ] Reuse KaTeX (LIQ-205) cho công thức trong slide
- [ ] Reuse Mermaid cho diagrams trong slide
- [ ] "Save deck" button → lưu vào `/library/decks`
- [ ] "Share" button → public URL `/decks/:slug` (read-only)
- [ ] "Export PDF" button (Phase 2.5)

### Illustration handling
- [ ] Tier 1 (default): icon từ Lucide (đã có) + illustration set unDraw bundled
- [ ] Tier 2 (PRO): generate ảnh qua fal.ai (Recraft V4 SVG) — cap 3 ảnh/deck
- [ ] Tier 2 cache theo `hash(prompt + style)` — không re-generate

## Technical approach

### SlideDeck JSON schema

```ts
// packages/validators/src/slide-deck.ts
import { z } from "zod";

const BlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("title"),    text: z.string(),  emphasis: z.enum(["primary","accent","muted"]).optional() }),
  z.object({ type: z.literal("subtitle"), text: z.string() }),
  z.object({ type: z.literal("body"),     text: z.string(),  size: z.enum(["sm","md","lg"]).optional() }),
  z.object({ type: z.literal("bullets"),  items: z.array(z.string()).max(6), style: z.enum(["dot","check","arrow","number"]).optional() }),
  z.object({ type: z.literal("quote"),    text: z.string(),  cite: z.string().optional() }),
  z.object({ type: z.literal("formula"),  latex: z.string() }),                                  // KaTeX
  z.object({ type: z.literal("diagram"),  mermaid: z.string() }),                                // Mermaid
  z.object({ type: z.literal("icon"),     name: z.string(),  color: z.string().optional() }),    // Lucide name
  z.object({ type: z.literal("illustration"), preset: z.string() }),                             // unDraw key
  z.object({ type: z.literal("aiImage"),  promptKey: z.string() }),                              // resolved server-side
  z.object({ type: z.literal("comparison"), left: z.object({ label: z.string(), items: z.array(z.string()) }),
                                            right: z.object({ label: z.string(), items: z.array(z.string()) }) }),
  z.object({ type: z.literal("timeline"), steps: z.array(z.object({ label: z.string(), desc: z.string().optional(), icon: z.string().optional() })).max(6) }),
  z.object({ type: z.literal("mnemonic"), letters: z.array(z.object({ char: z.string(), word: z.string() })) }),
]);

const SlideSchema = z.object({
  layout: z.enum(["title-cover","centered","two-column","timeline","comparison","quote","mnemonic","blank"]),
  background: z.enum(["plain","gradient-primary","gradient-accent","pattern-grid"]).optional(),
  blocks: z.array(BlockSchema).max(6),
  speakerNotes: z.string().optional(),                  // for TTS narration (LIQ-202)
  durationMs: z.number().int().min(2000).max(15000).optional(),
});

export const SlideDeckSchema = z.object({
  title: z.string(),
  slides: z.array(SlideSchema).min(3).max(10),
  sourceRefs: z.array(z.object({ bookId: z.string(), pageNumber: z.number() })),
  language: z.enum(["vi","en","mix"]),
});
```

### AI prompt template

`packages/ai-config/src/prompts/slide-summary.ts`:

```
Bạn là AI tutor sinh slide deck tóm tắt cho học sinh phổ thông.

INPUT:
- Nội dung textbook (chunks RAG): {{content}}
- Subject: {{subject}}
- Depth: {{depth}}  // "quick" 3-4 slides | "standard" 5-7 | "deep" 8-10
- Language preference: {{lang}}

OUTPUT (strict JSON theo schema SlideDeck):
- Slide 1 luôn là layout "title-cover"
- Slide cuối luôn là "key takeaways" (bullets)
- Mỗi slide ≤ 6 block, mỗi block ≤ 80 ký tự (mobile-readable)
- Ưu tiên block "icon"/"illustration" hơn ảnh AI (cost concern)
- Nếu có công thức → dùng "formula" (LaTeX)
- Nếu có process/flow → "timeline" hoặc "diagram" (Mermaid)
- Nếu so sánh 2 thứ → "comparison"
- Visual hierarchy: 1 emphasis "primary" mỗi slide, không spam
```

Gemini call với `responseSchema` + `responseMimeType: "application/json"` để force valid JSON.

### Renderer components

```
apps/web/src/components/slides/
  SlideDeckPlayer.tsx        # main controller, swipe, progress, autoplay
  SlideRenderer.tsx          # picks layout component
  layouts/
    TitleCoverLayout.tsx
    CenteredLayout.tsx
    TwoColumnLayout.tsx
    TimelineLayout.tsx
    ComparisonLayout.tsx
    QuoteLayout.tsx
    MnemonicLayout.tsx
  blocks/
    TitleBlock.tsx
    BulletsBlock.tsx
    FormulaBlock.tsx          # reuse KaTeX
    DiagramBlock.tsx          # reuse Mermaid
    IconBlock.tsx             # Lucide
    IllustrationBlock.tsx     # unDraw inline SVG
    AIImageBlock.tsx          # <img> with skeleton
    ComparisonBlock.tsx
    TimelineBlock.tsx
    MnemonicBlock.tsx
```

Each block xuất hiện với Framer Motion `motion.div` + variant `entrance`. Stagger children 80ms.

### unDraw bundling

Pre-curate ~80 illustration phù hợp education (study, science, math, biology, chemistry, history, language). Bundle SVG vào `apps/web/public/illustrations/`. AI chỉ chọn từ whitelist (avoid hallucination).

### AI image (Tier 2)

```ts
// apps/api/src/modules/ai/image-gen.service.ts
async generateForSlide(promptKey: string, style: "vector" | "infographic"): Promise<string> {
  const cached = await db.slideImage.findUnique({ where: { hash: hash(promptKey + style) } });
  if (cached) return cached.url;

  const result = await fetch("https://fal.run/fal-ai/recraft-v3/text-to-image", {
    method: "POST",
    headers: { Authorization: `Key ${env.FAL_API_KEY}` },
    body: JSON.stringify({
      prompt: promptKey,
      style: "vector_illustration",
      image_size: { width: 1024, height: 768 },
    }),
  });
  // Upload to R2, save SlideImage row
}
```

ENV mới: `FAL_API_KEY`.

### Export PDF

`apps/web/src/lib/slide-export.ts`:
- Dùng [html-to-image](https://github.com/bubkoo/html-to-image) → render từng slide thành PNG
- Combine bằng [jspdf](https://github.com/parallax/jsPDF) → PDF download
- Server-side render alternative: Puppeteer trên API (nặng hơn, để Phase 3)

## Data model

```prisma
model SlideDeckSnapshot {
  id           String   @id @default(cuid())
  userId       String
  subjectId    String?
  bookId       String?
  pageStart    Int?
  pageEnd      Int?
  topicId      String?
  title        String
  deckJson     Json
  language     String
  depth        String
  isPublic     Boolean  @default(false)
  shareSlug    String?  @unique
  viewCount    Int      @default(0)
  tokenUsage   Int?
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt])
  @@index([shareSlug])
}

model SlideImage {
  id        String   @id @default(cuid())
  hash      String   @unique
  prompt    String
  style     String
  url       String
  sizeBytes Int
  provider  String   // "recraft-v3" | "ideogram-v3" | ...
  createdAt DateTime @default(now())
}
```

## API design

```
POST /reader/summarize-slides
  body: { bookId, pageStart?, pageEnd?, topicId?, depth: "quick"|"standard"|"deep", language? }
  → { deckId, deck: SlideDeck }   // synchronous, < 10s

GET    /decks/:id          → SlideDeckSnapshot
PATCH  /decks/:id          { title?, isPublic? }
DELETE /decks/:id
GET    /decks              → paginated user's decks
GET    /decks/public/:slug → public read-only view (no auth)
POST   /decks/:id/export-pdf → returns blob
```

## UI notes

### Reader integration
- Floating action button "✨ Summarize" góc phải reader
- Click → modal "Quick (3 slide) / Standard / Deep" chooser
- Loading: shimmer 6 slide skeleton placeholder

### Player
- Swipeable trên mobile (Embla Carousel hoặc Framer drag)
- Tap left/right thirds = prev/next, tap middle = pause autoplay
- Bottom: dot indicators + share/save buttons
- Top: close X + slide counter (3/6) + progress bars (story-style)
- Long-press slide → "Explain more" (re-prompt với just slide content)

### Library
- Page `/library/decks` — grid card preview, filter theo subject/date
- Empty state link đến reader

### Theming
- Slide background dùng tokens từ [globals.css](../../../apps/web/src/app/globals.css)
- Dark mode: backgrounds invert, đảm bảo contrast
- Animation respects `prefers-reduced-motion`

## Service shortlist (đã khảo sát)

| Service | Mục đích | Cost | Verdict |
|---|---|---|---|
| Gemini 2.5 Pro JSON mode | Generate deck JSON | đã trong stack | ✅ Use |
| fal.ai Recraft V4 SVG | Tier 2 illustration | $0.04/ảnh | ✅ Premium tier only |
| fal.ai Ideogram V3 | Infographic có text | $0.03/ảnh | ⚠️ Backup nếu Recraft fail |
| unDraw | Free SVG illustrations | free | ✅ Tier 1 |
| Lucide React | Icons | đã có | ✅ |
| Framer Motion | Animations | npm, free | ✅ Add |
| Embla Carousel | Swipe | npm, free | ✅ Add |
| html-to-image + jsPDF | PDF export | npm, free | ✅ Add |
| Gamma 3.0 API / 2Slides API | All-in-one SaaS | $$, lock-in, no brand | ❌ Reject |
| Slidev / Marp / Reveal.js | Slide engines | free | ❌ Vue/Markdown, không nhúng inline đẹp |
| Presenton (open-source) | Self-host AI deck | free | ⚠️ Tham khảo nếu muốn build nhanh |

## Testing

- Unit: SlideDeckSchema.parse() reject invalid output từ AI
- Unit: layout components render mỗi block type
- Visual regression: snapshot 1 deck mẫu mỗi layout
- E2E: gõ "summarize chapter 3" → deck render full, swipe được
- A11y: keyboard nav (← → Esc), screen reader đọc speaker notes
- Mobile: iOS Safari swipe + autoplay không break, no jank
- Cost: log token + image $/deck, alert nếu >$0.30/deck

## Telemetry

- Event `deck_generated` { depth, slideCount, tokenIn, tokenOut, costUSD, durationMs }
- Event `deck_viewed` { deckId, completionPct }
- Event `deck_shared` / `deck_exported`

## Out of scope

- User edit deck (drag-drop slide editor) — Phase 3
- Voice narration auto-play (cần TTS — LIQ-202) — Phase 2.5 sau khi LIQ-202 ship
- Embed Manim animation vào slide (cần LIQ-310) — Phase 3
- Collaborative deck — Phase 3
- Video export (MP4) — Phase 3

## References

- Gemini structured output: https://ai.google.dev/gemini-api/docs/structured-output
- Recraft V4 SVG (fal.ai): https://fal.ai/models/fal-ai/recraft-v3
- unDraw illustrations: https://undraw.co/
- Framer Motion: https://www.framer.com/motion/
- Embla Carousel: https://www.embla-carousel.com/
- Presenton (open-source reference): https://github.com/presenton/presenton
- DeepTutor "Visualize" mode (Apache-2.0 inspiration): https://github.com/HKUDS/DeepTutor
