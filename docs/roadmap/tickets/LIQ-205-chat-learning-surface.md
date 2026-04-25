---
id: LIQ-205
title: Chat Learning Surface (LaTeX/Mermaid/source panel)
phase: 2
priority: P1
estimate: 5d
status: Backlog
depends_on: []
blocks: []
tags: [frontend, ai, content-render]
---

# LIQ-205 — Chat Learning Surface

## Problem

Chat hiện render với `ReactMarkdown + remarkGfm` ([chat/[id]/page.tsx:7-8](../../../apps/web/src/app/chat/[id]/page.tsx#L7-L8)) — không đủ cho STEM subjects:
- **Math/Physics**: không render LaTeX → học sinh thấy `$\frac{dy}{dx}$` raw
- **Biology/Chemistry**: không thể vẽ flowcharts, pathways
- **RAG sources**: `ChatMessage.ragSources[]` có sẵn nhưng **không hiển thị** → mất trust vì user không biết AI lấy info từ đâu

## User story

> Là học sinh A-Level Maths đang học tính tích phân, em muốn thấy công thức render đẹp, và khi Linh đề cập định lý Stokes em muốn click vào để mở trang textbook gốc — biết Linh nói thật chứ không bịa.

## Acceptance criteria

- [ ] Render LaTeX inline + block với KaTeX (`remark-math` + `rehype-katex`)
- [ ] Render Mermaid diagrams (flowcharts, sequence, state diagrams) — lazy-load
- [ ] Code blocks với syntax highlighting (Shiki hoặc Prism) + copy button
- [ ] Table rendering polished (overflow-x scroll, zebra rows)
- [ ] "Sources" panel below each assistant message — collapsible
- [ ] Click source link → open Reader với đúng page + highlight chunk
- [ ] "Explain Like I'm 12 / 16 / Expert" toggle per message
- [ ] Copy message button, feedback 👍/👎 (analytics only, no behavior change yet)
- [ ] Message hover reveals: timestamp, model used (from `modelUsed`), token count

## Technical approach

### Frontend rendering

Add dependencies:
```bash
pnpm --filter web add remark-math rehype-katex katex mermaid shiki
```

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

<ReactMarkdown
  remarkPlugins={[remarkGfm, remarkMath]}
  rehypePlugins={[rehypeKatex]}
  components={{
    code: CodeBlock,        // mermaid + shiki-aware
    table: StyledTable,
    a: SourceLink,
  }}
>
  {message.content}
</ReactMarkdown>
```

Mermaid code block detection:
```tsx
function CodeBlock({ className, children }) {
  const lang = className?.replace("language-", "");
  if (lang === "mermaid") return <MermaidDiagram chart={children} />;
  return <ShikiBlock lang={lang}>{children}</ShikiBlock>;
}
```

### Source panel

Already have `ChatMessage.ragSources: String[]` — format stored should be JSON-ish `[{documentId, chunkId, pageNumber, preview}]` — if currently just IDs, extend writing pipeline in [chat.service.ts](../../../apps/api/src/modules/chat/chat.service.ts) to store hydrated info.

UI:
```tsx
<details className="mt-2 text-sm">
  <summary>{message.ragSources.length} sources</summary>
  <ul>
    {sources.map(s => (
      <li>
        <Link href={`/reader/${subjectId}?book=${s.bookId}&page=${s.pageNumber}`}>
          📖 {s.bookTitle} — p.{s.pageNumber}
        </Link>
        <p className="text-muted">{s.preview}</p>
      </li>
    ))}
  </ul>
</details>
```

### "Explain like"

Send follow-up message server-side with modified prompt: `"Re-explain previous answer for a {audience} level"`. Use `ai.service.ts` new method `reexplain(messageId, level)`.

Quick action buttons on message:
```tsx
<button onClick={() => reexplain("age-12")}>📚 Simpler</button>
<button onClick={() => reexplain("expert")}>🎓 Deeper</button>
```

### Reader integration

Reader page needs to accept `?page=X&highlight=chunkId` query param and:
- Navigate to that page
- Scroll highlight into view
- Temporary accent outline on chunk

## API design

```ts
POST /chat/sessions/:id/messages/:msgId/reexplain { level: "age-12" | "standard" | "expert" }
  → SSE stream with new message
```

## UI notes

- KaTeX font loaded once globally
- Mermaid: light/dark theme matching app
- Code blocks: monospace, subtle bg, rounded
- Source chip: small, pill-shaped, icon + "p.42"
- "Explain like": floating action buttons appearing on hover

## Testing

- Visual: render sample messages with LaTeX, mermaid, tables, code
- Cross-browser: Safari iOS KaTeX glyphs, Firefox Mermaid
- Performance: message with 10 diagrams doesn't freeze scroll
- E2E: click source → lands on correct page with highlight

## Out of scope

- Diagram editing by user (Phase 3)
- Whiteboard drawing in chat (Phase 3)
- Exporting message as PDF (future)

## References

- [KaTeX](https://katex.org/)
- [Mermaid](https://mermaid.js.org/)
- [Shiki](https://shiki.matsu.io/)
