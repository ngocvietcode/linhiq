---
id: LIQ-106
title: Sticky Hint Level Selector (mobile)
phase: 1
priority: P0
estimate: 1d
status: Backlog
depends_on: []
blocks: []
tags: [frontend, ux, mobile]
---

# LIQ-106 — Sticky Hint Level Selector

## Problem

Hint level (L1–L5) là **core differentiator** của LinhIQ — nhưng trong chat hiện tại nó bị ẩn trong menu hoặc khó reach. User phải click menu → select L3 → close → gõ message. Friction quá lớn với feature quan trọng nhất.

Constants đã define tại [chat/[id]/page.tsx:53-59](../../../apps/web/src/app/chat/[id]/page.tsx#L53-L59) nhưng UI chưa làm prominent.

## User story

> Là học sinh, em muốn escalate hint level trong 1 tap khi câu trả lời của Linh vẫn quá mơ hồ — không phải mở menu lại.

## Acceptance criteria

- [ ] Hint level selector = horizontal chip row ngay phía trên chat input
- [ ] 5 chip (L1 … L5), chip active highlighted với `--color-accent`
- [ ] Tap chip → immediately apply + visual bounce feedback
- [ ] Chip scroll horizontally trên màn nhỏ (tránh chồng lên nhau)
- [ ] Tooltip on long-press (mobile) / hover (desktop) hiển thị description
- [ ] Chip có micro-label: "L1 Nudge · L2 Structure · L3 Terms · L4 Example · L5 Near Answer"
- [ ] Persisted to `ChatSession.hintLevel` khi thay đổi
- [ ] On desktop: giữ layout hiện tại nhưng vẫn add chip row (consistency)
- [ ] Accessibility: aria-label + keyboard navigation (arrow keys)

## Technical approach

### Frontend only

Refactor `apps/web/src/app/chat/[id]/page.tsx`:

```tsx
// Above input, below messages
<div className="sticky bottom-[input-height] flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
  {HINT_LEVELS.map(({ level, label, desc }) => (
    <button
      key={level}
      onClick={() => changeHintLevel(level)}
      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
      style={active ? activeStyle : inactiveStyle}
      aria-label={`Hint level ${label}: ${desc}`}
      aria-pressed={active}
    >
      {label}
    </button>
  ))}
</div>
```

Existing `PATCH /chat/sessions/:id` với `{ hintLevel }` — reuse.

## UI notes

- Active chip: filled bg `--color-accent`, text white
- Inactive: transparent bg, border subtle, text muted
- Micro-animation: `transform: scale(1.05)` on active
- When escalating L1→L5 programmatically (after repeated "I don't get it"), animate chip sliding through levels

## Testing

- E2E: select L3 → send message → backend receives hintLevel=L3 → AI response reflects scaffolding
- Visual: test on iPhone SE (narrow), tablet, desktop
- A11y: Axe check, keyboard-only navigation works

## Out of scope

- AI auto-escalate detection (Phase 2 — detect repeated confusion and suggest bump)
- Custom hint level above L5 ("solve it for me") — explicitly not doing, core pedagogy

## References

- [Claude Design System](../../../apps/web/src/app/globals.css) for accent/motion tokens
