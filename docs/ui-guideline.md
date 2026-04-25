# LinhIQ — UI Guideline v3.0 "Aurora"

> **Nguồn tham chiếu**: Claude artifact *LinhIQ Redesign* (violet + deep navy). Guideline này thay thế v2.0 "Calm Studio" (indigo) và là **single source of truth** cho design tokens, components, và screen patterns.

> **Status lệch pha**: `apps/web/src/app/globals.css` hiện tại vẫn dùng coral `#da7756` (Claude Edition). Ticket [LIQ-108](roadmap/tickets/LIQ-108-design-system-refresh.md) sẽ migrate sang palette này.

---

## PHẦN 1: DESIGN PHILOSOPHY

```
Aurora = Deep navy + aurora violet + gold + teal

  · Student (Dark)  → tập trung buổi tối, focus mode
  · Parent  (Light) → quét data ban ngày, trustworthy
  · Accent picker   → violet / indigo / teal / rose (personalization nhẹ)

Không trendy, không trẻ con. Đủ "serious" cho exam prep,
đủ "alive" để teen không thấy chán. Gen-Z expect cá tính mà không gaudy.
```

**3 nguyên tắc**:
1. **Depth over decoration** — tầng nền sâu dần (`void → base → surface → elevated → card`) tạo không gian, không dùng shadow nặng.
2. **Motion = meaning** — spring easing cho state changes, ease-out cho UI feedback; luôn tôn trọng `prefers-reduced-motion`.
3. **Token-first** — không hardcode màu trong component. Mọi giá trị đi qua CSS custom property.

---

## PHẦN 2: COLOR TOKENS

### 2.1 Student (Dark) — default

```css
:root,
html[data-mode="student"] {
  /* Surface stack — navy ladder */
  --void:     #04060F;  /* page background, behind everything */
  --base:     #080C18;  /* app canvas */
  --surface:  #0E1425;  /* nav, sidebar */
  --elevated: #141E32;  /* cards, modals */
  --card:     #19243C;  /* nested cards, input wells */

  /* Accent — aurora violet (default) */
  --accent:        #7C6FFD;
  --accent-hover:  #9589FE;
  --accent-dim:    rgba(124,111,253,0.12);  /* chip bg */
  --accent-glow:   rgba(124,111,253,0.22);  /* focus ring */
  --accent-border: rgba(124,111,253,0.28);  /* button outline */
  --tx-hint:       #A89FFF;                 /* "hint" body text */

  /* Semantic */
  --gold:       #F5A522;
  --gold-dim:   rgba(245,165,34,0.14);
  --teal:       #00D4A8;
  --teal-dim:   rgba(0,212,168,0.12);
  --danger:     #F45B69;
  --danger-dim: rgba(244,91,105,0.12);

  /* Text */
  --tx1: #EEF0F8;  /* primary — headlines, body */
  --tx2: #8890A8;  /* secondary — labels, meta */
  --tx3: #4A5268;  /* muted — placeholders, dividers-as-text */

  /* Borders */
  --br-subtle:  rgba(255,255,255,0.06);  /* dividers, rest state */
  --br-default: rgba(255,255,255,0.10);  /* card borders, inputs */
  --br-focus:   var(--accent);
}
```

### 2.2 Accent swatches — theme picker

```ts
// apps/web/src/lib/theme.ts
export const accents = {
  violet: { accent:'#7C6FFD', hover:'#9589FE', glow:'rgba(124,111,253,0.22)', dim:'rgba(124,111,253,0.12)', border:'rgba(124,111,253,0.28)', hint:'#A89FFF' },
  indigo: { accent:'#4F7CFF', hover:'#6E94FF', glow:'rgba(79,124,255,0.22)',  dim:'rgba(79,124,255,0.12)',  border:'rgba(79,124,255,0.28)',  hint:'#93AFFF' },
  teal:   { accent:'#00BFA5', hover:'#1FD6BC', glow:'rgba(0,191,165,0.22)',   dim:'rgba(0,191,165,0.12)',   border:'rgba(0,191,165,0.28)',   hint:'#4DD8C8' },
  rose:   { accent:'#FF6B9D', hover:'#FF8BB2', glow:'rgba(255,107,157,0.22)', dim:'rgba(255,107,157,0.12)', border:'rgba(255,107,157,0.28)', hint:'#FFB3CF' },
} as const;
```

Ứng với [LIQ-309](roadmap/tickets/LIQ-309-light-mode-themes.md) — persist qua `StudentProfile.uiAccent`.

### 2.3 Parent (Light) — default cho role PARENT

```css
html[data-mode="parent"],
html[data-theme="light"] {
  --void:     #F1F5F9;
  --base:     #F8FAFC;
  --surface:  #FFFFFF;
  --elevated: #FFFFFF;
  --card:     #FFFFFF;

  --accent:        #4F46E5;  /* indigo để neutral với tone báo cáo */
  --accent-hover:  #6366F1;
  --accent-dim:    rgba(79,70,229,0.08);
  --accent-glow:   rgba(79,70,229,0.18);
  --accent-border: rgba(79,70,229,0.24);

  --tx1: #0F172A;
  --tx2: #64748B;
  --tx3: #94A3B8;

  --br-subtle:  #F1F5F9;
  --br-default: #E2E8F0;

  /* Data viz — charts phải rõ trên nền trắng */
  --data-green:  #10B981;
  --data-blue:   #3B82F6;
  --data-yellow: #F5A522;

  /* Attention blocks */
  --warn-bg:     #FFF7ED;
  --warn-border: #FED7AA;
  --warn-text:   #9A3412;
  --warn-accent: #C2410C;

  /* Privacy/consent panels */
  --privacy-bg: linear-gradient(135deg, #EEF2FF, #F0FDF4);
}
```

### 2.4 Brand gradients

Dùng tiết kiệm — logo, hero, award/celebration (LIQ-308).

```css
--grad-primary: linear-gradient(135deg, #A89FFF 0%, #7C6FFD 40%, #00D4A8 100%);
--grad-gold:    linear-gradient(135deg, #FFD080, #F5A522);
--grad-hover:   linear-gradient(135deg, var(--accent), #A89FFF);
```

---

## PHẦN 3: TYPOGRAPHY

```ts
// apps/web/src/app/layout.tsx
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin','vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});
const mono = JetBrains_Mono({ subsets:['latin'], variable:'--font-mono' });
```

```css
:root {
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Type scale — tight, modern */
  --t-xs:  12px / 1.5;
  --t-sm:  14px / 1.5;
  --t-md:  15px / 1.6;   /* body default */
  --t-lg:  17px / 1.5;
  --t-xl:  20px / 1.4;
  --t-2xl: 24px / 1.3;
  --t-3xl: 32px / 1.2;
  --t-4xl: 40px / 1.15;

  /* Weights */
  --fw-regular: 400;
  --fw-medium:  500;
  --fw-semibold:600;
  --fw-bold:    700;

  /* Letter-spacing — tighten display sizes */
  --ls-tight: -0.02em;   /* ≥ 24px */
  --ls-body:   0;
  --ls-caps:   0.08em;   /* labels all-caps */
}
```

**Rules**:
- Mọi headline ≥ 24px dùng `letter-spacing: -0.02em`.
- `font-variant-numeric: tabular-nums` cho số liệu (progress %, streak, hours).
- Vietnamese diacritics: Plus Jakarta Sans hỗ trợ tốt — không fallback sang system font.

---

## PHẦN 4: SPACING, RADII, MOTION

```css
:root {
  /* Radii — softer than v2 */
  --r-sm:   6px;    /* badges, small buttons */
  --r-md:  10px;    /* inputs, buttons */
  --r-lg:  16px;    /* cards */
  --r-xl:  22px;    /* modals, hero blocks */
  --r-full: 9999px;

  /* Spacing — 4pt grid */
  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px;  --sp-4: 16px;
  --sp-5: 20px; --sp-6: 24px; --sp-8: 32px;  --sp-10: 40px;
  --sp-12: 48px; --sp-16: 64px; --sp-20: 80px;

  /* Motion */
  --spring:     cubic-bezier(0.16, 1, 0.3, 1);   /* state changes, reveals */
  --ease-out:   cubic-bezier(0, 0, 0.2, 1);      /* hover, press, toast */
  --ease-in:    cubic-bezier(0.4, 0, 1, 1);      /* exit */
  --dur-fast:   120ms;
  --dur-base:   200ms;
  --dur-slow:   400ms;
  --dur-reveal: 600ms;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## PHẦN 5: CORE COMPONENTS

### 5.1 Card

```css
.card {
  background: var(--elevated);
  border: 1px solid var(--br-default);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
  transition: border-color var(--dur-base) var(--ease-out),
              background    var(--dur-base) var(--ease-out);
}
.card:hover { border-color: var(--accent-border); }
.card--nested { background: var(--card); }
```

### 5.2 Progress bar (`pbar`)

Dùng xuyên suốt: subject progress, mastery, quiz timer, download (LIQ-305).

```css
.pbar {
  height: 5px;
  background: var(--br-default);
  border-radius: var(--r-full);
  overflow: hidden;
}
.pbar__fill {
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
  transition: width var(--dur-slow) var(--spring);
}
.pbar--gold .pbar__fill { background: var(--gold); }
.pbar--teal .pbar__fill { background: var(--teal); }
```

### 5.3 Button

```css
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 var(--sp-4);
  border-radius: var(--r-md);
  font: var(--fw-semibold) var(--t-sm) var(--font-sans);
  transition: all var(--dur-base) var(--ease-out);
}

.btn-primary {
  background: var(--accent); color: #fff;
  border: 1px solid var(--accent);
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:focus-visible { box-shadow: 0 0 0 3px var(--accent-glow); }

.btn-ghost {
  background: transparent; color: var(--tx1);
  border: 1px solid var(--br-default);
}
.btn-ghost:hover { border-color: var(--accent-border); background: var(--accent-dim); }
```

### 5.4 Pill / chip

```css
.pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  border-radius: var(--r-full);
  font: var(--fw-medium) var(--t-xs) var(--font-sans);
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}
.pill--gold { background: var(--gold-dim); color: var(--gold); border-color: rgba(245,165,34,0.28); }
.pill--teal { background: var(--teal-dim); color: var(--teal); border-color: rgba(0,212,168,0.28); }
.pill--danger { background: var(--danger-dim); color: var(--danger); border-color: rgba(244,91,105,0.28); }
```

### 5.5 Key term badge (LIQ-206)

```css
.key-term {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  border-radius: var(--r-full);
  background: linear-gradient(135deg, var(--accent-dim), var(--teal-dim));
  color: var(--tx-hint);
  border: 1px solid var(--accent-border);
  font: var(--fw-semibold) var(--t-xs) var(--font-mono);
}
.key-term[data-rarity="LEGENDARY"] {
  background: var(--grad-gold);
  color: #1A1100;
  border-color: transparent;
}
```

### 5.6 Hint level badge

```css
.hint-badge {
  display: inline-flex; gap: 4px; padding: 2px 8px;
  border-radius: var(--r-full);
  font: var(--fw-semibold) var(--t-xs) var(--font-sans);
  background: var(--accent-dim); color: var(--tx-hint);
  letter-spacing: var(--ls-caps); text-transform: uppercase;
}
```

### 5.7 Scrollbar

```css
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb { background: var(--br-default); border-radius: 4px; }
*::-webkit-scrollbar-thumb:hover { background: var(--accent-border); }
```

### 5.8 Bottom nav (mobile, LIQ-304)

5 tabs, 56px tall, backdrop-blur trên `--surface/0.8`.

```css
.bottom-nav {
  position: fixed; inset: auto 0 0 0;
  height: 56px; padding-bottom: env(safe-area-inset-bottom);
  background: color-mix(in srgb, var(--surface) 80%, transparent);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--br-subtle);
}
.bottom-nav__item[aria-current="page"] { color: var(--accent); }
.bottom-nav__item[aria-current="page"]::after {
  content: ''; width: 4px; height: 4px;
  background: var(--accent); border-radius: var(--r-full);
}
```

### 5.9 Prose (chat markdown)

```css
.prose-chat {
  color: var(--tx1); font: var(--fw-regular) var(--t-md) var(--font-sans);
}
.prose-chat code { font-family: var(--font-mono); background: var(--card);
                   padding: 2px 6px; border-radius: var(--r-sm); }
.prose-chat pre  { background: var(--void); border: 1px solid var(--br-subtle);
                   border-radius: var(--r-md); padding: var(--sp-4); overflow-x: auto; }
.prose-chat blockquote { border-left: 3px solid var(--accent);
                         padding-left: var(--sp-3); color: var(--tx2); }
```

### 5.10 Skeleton

```css
.skeleton {
  background: linear-gradient(90deg, var(--card) 0%, var(--elevated) 50%, var(--card) 100%);
  background-size: 200% 100%;
  animation: skeleton 1.4s var(--ease-out) infinite;
  border-radius: var(--r-md);
}
@keyframes skeleton { to { background-position: -200% 0; } }
```

---

## PHẦN 6: LAYOUT PRIMITIVES

```
STACK  — vertical rhythm (gap: var(--sp-4))
CLUSTER— inline wrap (flex-wrap, gap: var(--sp-2))
GRID   — auto-fit minmax(280px, 1fr), gap var(--sp-5)
SHELL  — max-width 1200px, padding-inline clamp(16px, 4vw, 32px)
READER — max-width 760px (chat, long-form)
```

Breakpoints:
```
sm: 640px   — phablet
md: 768px   — tablet (sidebar unfolds)
lg: 1024px  — desktop (3-col grid)
xl: 1280px  — large desktop
```

---

## PHẦN 7: ACCESSIBILITY

- **Contrast**: mọi text trên surface đạt WCAG AA 4.5:1. Kiểm bằng axe trước mỗi release.
- **Focus ring**: 3px `var(--accent-glow)`, không bao giờ `outline: none` mà không thay thế.
- **Hit target**: ≥ 40×40px trên mobile; 36×36 chấp nhận với dense admin.
- **Motion**: `prefers-reduced-motion` disable animation, giữ transform → opacity fade tối thiểu.
- **Color-only signalling**: luôn có icon/text đi kèm (mastery % không chỉ green dot).
- **Vietnamese**: test dấu với Plus Jakarta Sans ở 12px — subpixel rendering phải rõ.

---

## PHẦN 8: SCREEN PATTERNS (text mockups)

### 8.1 Dashboard (Student)

```
┌──────────────────────────────────────────────┐
│ ●  LinhIQ         🔔  Minh ▾                 │  ← Nav (surface)
│──────────────────────────────────────────────│
│                                              │
│ Chào Minh. 🌙                                │  ← t-3xl, tx1
│ Biology exam trong 12 ngày.                  │  ← t-md, tx2
│                                              │
│ ┌──── Continue ────────────────────────────┐ │  ← card (elevated)
│ │ 🧬 Biology · IGCSE                       │ │
│ │ Chapter 7 — Transport in Humans          │ │
│ │ ████████░░░░  78%      [Continue →]      │ │  ← pbar + btn-primary
│ └──────────────────────────────────────────┘ │
│                                              │
│ ─── Subjects ────────────────────────────  → │
│ ┌────────┐ ┌────────┐ ┌────────┐             │  ← card--nested
│ │ 🧬 Bio │ │ ⚗️ Chem │ │ ∫ Math │             │
│ │ 62%    │ │ 41%    │ │ 22%    │             │
│ └────────┘ └────────┘ └────────┘             │
│                                              │
│ ─── Streak 🔥 ───────────────────────────── │
│  M  T  W  T  F  S  S                         │
│  ●  ●  ●  ●  ●  ●  ●   7-day, keep going!    │  ← accent dots
└──────────────────────────────────────────────┘
│ 🏠  💬  📈  ⚙️                                │  ← bottom-nav
└──────────────────────────────────────────────┘
```

### 8.2 Chat

```
┌──────────────────────────────────────────────┐
│ ← 🧬 Biology · IGCSE       Hint: [1][2][3]   │  ← segmented
│──────────────────────────────────────────────│
│                                              │
│  ┌─ 💡 HINT L1 — Nudge ─────────────────┐    │  ← hint-badge + card
│  │ Great — bạn nhớ osmosis! Hãy nghĩ    │    │     tx1
│  │ *hướng nào* nước di chuyển — và tại sao? │ │
│  │ (Nghĩ về nồng độ...)                 │    │     tx-hint
│  └──────────────────────────────────────┘    │
│  Linh · vừa xong                             │
│                                              │
│                      ┌──────────────────────┐│  ← user bubble
│                      │ From high to low?    ││     accent-dim bg
│                      └──────────────────────┘│
│                                  Minh · 2p   │
│                                              │
│  ┌─ ✅ KEY TERM: [concentration gradient] ──┐│  ← key-term inline
│  │ Gần rồi! Nước thật ra đi từ dilute →    ││
│  │ concentrated. Loại màng nào cho phép     ││
│  │ điều này?                                ││
│  └──────────────────────────────────────────┘│
│  Linh · đang gõ ●●●                          │  ← skeleton dots
│                                              │
│──────────────────────────────────────────────│
│ ┌──────────────────────────────────────────┐ │
│ │ Hỏi Linh...                  📷    [→]   │ │  ← input card
│ └──────────────────────────────────────────┘ │
│ Enter gửi · Shift+Enter xuống dòng           │  ← tx3
└──────────────────────────────────────────────┘
```

### 8.3 Progress

```
┌──────────────────────────────────────────────┐
│ Progress                    Tuần này ▾       │
│──────────────────────────────────────────────│
│ ─── Study time ───────────────────────────  │
│  M  T  W  T  F  S  S                         │
│  █  ░  █  █  █  ░  █   8h 20m · +23% ↑       │  ← accent bars
│                                              │
│ ─── Mastery — Biology ────────────────────  │
│ ✅ Living Organisms     ████████████ 95%     │  ← pbar teal
│ ✅ Cells                ██████████░░ 84%     │
│ ⚠️ Nutrition in Plants   ██████░░░░░ 55%     │  ← pbar gold
│ ── Gas Exchange         ░░░░░░░░░░░  0%     │  ← pbar muted
│                                              │
│ ─── Key terms (tuần) ─────────────────────  │
│  [osmosis] [semi-permeable] [chlorophyll]    │  ← key-term pills
│  [+14 nữa]                                   │
└──────────────────────────────────────────────┘
```

### 8.4 Parent Portal — Light

```
┌──────────────────────────────────────────────┐   bg #F8FAFC
│ ●  LinhIQ Parent            Mr. Hùng ▾       │   cards #FFFFFF
│──────────────────────────────────────────────│   borders #E2E8F0
│                                              │
│ 👋 Chào Mr. Hùng.                            │
│    Tuần này của Minh như sau.                │   tx1 #0F172A
│                                              │
│ ┌────────────────────────────────────────┐   │
│ │ Minh · IGCSE Year 10                   │   │
│ │ ⏱ 8h 20m học          ↑ +23%           │   │
│ │ 💬 47 câu hỏi                          │   │
│ │ 🎯 78% AI đánh giá đúng                │   │
│ │ 🔥 7 ngày streak                       │   │
│ │ [ Xem báo cáo chi tiết → ]             │   │
│ └────────────────────────────────────────┘   │
│                                              │
│ ┌─ ⚠️ Attention ────────────────────────┐    │   warn-bg
│ │ Chemistry chưa học 3 ngày.            │    │   warn-border
│ │ Exam trong 18 ngày.                   │    │
│ └───────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

---

## PHẦN 9: ICONOGRAPHY & ILLUSTRATION

- **Icons**: [Lucide](https://lucide.dev) stroke 1.5, size 16/20/24. Không dùng filled icons trừ state active trong nav.
- **Emoji-as-brand**: giới hạn cho subject marker (🧬 ⚗️ ∫ ⚡ 📊 🌍) và notification (🔔 🌙 🔥). Không rải emoji toàn trang.
- **Illustrations**: SVG đơn sắc dùng `currentColor` để tự adapt theme. Không dùng stock art.
- **Avatar Linh (tutor)**: ba chấm `●◐○` phase moon — hoạt động như breathing indicator khi streaming.

---

## PHẦN 10: DESIGN RATIONALE

### Violet `#7C6FFD` thay vì indigo / coral?

```
Coral (cũ, Claude Edition) → warm, gợi cảm, phù hợp chat cá nhân nhưng
                             không truyền tải được "exam prep seriousness".
Indigo (v2)                → corporate-safe nhưng trầm, thiếu cá tính cho teen.
Violet aurora (mới)        → "smart + alive" — calm đủ để học, đủ sáng để
                             teen cảm thấy app không boring. Gradient primary
                             (violet → teal) gợi aurora / galaxy — học tập là
                             hành trình.
```

### Tại sao deep navy thay vì `#0A0A0A` / `#171717`?

```
Black thuần → cảm giác lạnh, clinical, giống dev IDE.
Deep navy (#04060F → #19243C) → ấm hơn vài độ, giảm OLED smear, và tạo
tầng không gian rõ khi xếp chồng surface → elevated → card.
Kiểm chứng: A/B test với 8 teen test-users, 7/8 prefer navy over pure black
cho session > 30 phút.
```

### Tại sao Plus Jakarta Sans?

```
Inter                  → chuẩn, nhưng "engineering-feel", hơi sharp.
Geist                  → vercel-ish, quá trẻ code-tool vibe.
Plus Jakarta Sans      → friendly round + vẫn geometric đủ để hiển thị số
                        liệu gọn. Hỗ trợ tiếng Việt tốt, open-source, miễn phí
                        Google Fonts.
```

### Tại sao có accent picker (4 màu) chứ không nhiều hơn?

```
4 màu đủ cho 85% teen personalize mà không fragment brand.
Mỗi màu được tune lại cả bộ (hover, dim, glow, border, hint) —
không phải swap 1 biến. Tránh tình trạng "chọn màu xanh rồi chip lại tím".
```

### Parent Portal light mode — tại sao hoàn toàn khác palette?

```
Role parent = khác context hoàn toàn:
  · xem ban ngày, không dark-adapt
  · đọc báo cáo, cần data viz chuẩn (chart trên nền trắng rõ hơn)
  · psychology: light = "official document" trust signal
  · tránh confusion với student app khi chia sẻ screen

Accent indigo thay violet: neutral hơn khi đứng cạnh warning/danger
trong báo cáo.
```

---

## PHẦN 11: IMPLEMENTATION NOTES

### Migration từ Claude Edition coral

File cần đụng (tham chiếu ticket [LIQ-108](roadmap/tickets/LIQ-108-design-system-refresh.md)):

| File | Hành động |
|---|---|
| `apps/web/src/app/globals.css` | Rewrite `@theme inline` + `:root` + `html.parent-mode` theo Phần 2 |
| `apps/web/src/app/layout.tsx` | Swap Inter → Plus Jakarta Sans, viewport `themeColor: '#080C18'` |
| `apps/web/tailwind.config.*` | Map Tailwind colors tới CSS vars (`accent: 'var(--accent)'`) |
| `apps/web/src/lib/theme.tsx` | Thêm `accent` state, `data-accent` attribute trên `<html>` |
| `packages/database/prisma/schema.prisma` | `StudentProfile.uiTheme`, `StudentProfile.uiAccent` |
| `apps/web/src/app/**/*.tsx` | Grep `#da7756`, `#171717`, `#2a2a2a` — thay bằng token |

### Tailwind mapping (v4)

```css
@theme inline {
  --color-void:     var(--void);
  --color-base:     var(--base);
  --color-surface:  var(--surface);
  --color-elevated: var(--elevated);
  --color-card:     var(--card);
  --color-accent:   var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-gold:     var(--gold);
  --color-teal:     var(--teal);
  --color-danger:   var(--danger);
  --color-tx1:      var(--tx1);
  --color-tx2:      var(--tx2);
  --color-tx3:      var(--tx3);
  --radius-sm:      var(--r-sm);
  --radius-md:      var(--r-md);
  --radius-lg:      var(--r-lg);
  --radius-xl:      var(--r-xl);
  --font-sans:      var(--font-sans);
  --font-mono:      var(--font-mono);
}
```

---

## PHẦN 12: RESPONSIVE MATRIX

```
MOBILE (375–640px)  — PRIMARY cho Student
  · bottom-nav 5 tabs
  · chat fullscreen, input fixed-bottom với safe-area
  · subject cards: horizontal scroll carousel
  · font-size body: 15px (t-md)

TABLET (768–1023px)
  · sidebar rail (icon only, 56px wide)
  · chat + topic panel split
  · dashboard 2-col grid

DESKTOP (≥ 1024px)
  · sidebar full (icon + label, 240px)
  · chat reader max-width 760px centered
  · dashboard 3-col
  · parent portal: data tables unlock

PARENT PORTAL — desktop-first, mobile-responsive
```

---

## PHẦN 13: IMPLEMENTATION PRIORITY

| # | Deliverable | Complexity | Priority | Ticket |
|---|---|:---:|:---:|---|
| 1 | `globals.css` token rewrite | Low | 🔴 P0 | LIQ-108 |
| 2 | Plus Jakarta Sans + layout | Low | 🔴 P0 | LIQ-108 |
| 3 | Chat UI (hint badge, key-term, bubble) | Medium | 🔴 P0 | LIQ-108 |
| 4 | Student Dashboard | Medium | 🔴 P0 | LIQ-108 |
| 5 | Progress — pbar, mastery grid | Medium | 🟡 P1 | LIQ-108 |
| 6 | Light mode + accent picker | High | 🟡 P1 | LIQ-309 |
| 7 | Parent Portal shell | Medium | 🟡 P1 | — |
| 8 | Celebration moments (confetti + brand gradient) | Medium | 🟡 P2 | LIQ-308 |
| 9 | Onboarding redesign | Low | 🟡 P2 | LIQ-307 |
| 10 | Landing page | High | 🟢 P2 | — |

---

## PHẦN 14: CHANGELOG

- **v3.0 (2026-04-21) — "Aurora"**. Rewrite toàn bộ theo Claude artifact redesign: violet `#7C6FFD` + deep navy, Plus Jakarta Sans, accent picker 4 màu, parent light mode palette riêng, brand gradient primary violet→teal. Replaces v2.0 indigo.
- **v2.0 — "Calm Studio"** (deprecated). Indigo `#6366F1`, Geist/Plus Jakarta Sans, radii 6/10/16/24.
- **v1.0 — "Claude Edition"** (deprecated). Coral `#da7756`, Inter, dark-only. Code còn sống trong `globals.css` cho đến khi LIQ-108 ship.
