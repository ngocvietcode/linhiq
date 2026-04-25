---
id: LIQ-309
title: Light mode + theme customization
phase: 3
priority: P2
estimate: 3d
status: Backlog
depends_on: []
blocks: []
tags: [frontend, ux, a11y, personalization]
---

# LIQ-309 — Light Mode + Themes

## Problem

Current design is **dark-mode only** with hardcoded `--color-accent: #DA7756`. Research: 1/3 users prefer light, 1/3 dark, 1/3 mixed. Accessibility: dark mode can hurt students with astigmatism.

Teen cũng muốn personalization — accent color customization is big on Discord, Telegram, etc.

## User story

> Là học sinh học ban ngày ở lớp (sáng), em muốn dùng light mode. Em cũng muốn đổi màu accent sang xanh lá hoặc tím — thể hiện cá tính.

## Acceptance criteria

- [ ] Light mode with WCAG AA compliant contrast (4.5:1 text)
- [ ] Auto mode: follow system preference (`prefers-color-scheme`)
- [ ] Manual override in settings: Light / Dark / System
- [ ] 4-5 accent colors: Orange (default), Blue, Green, Purple, Pink
- [ ] Setting persists (localStorage + user profile on server)
- [ ] All existing components work in both modes
- [ ] Images / illustrations adapt (SVG with `currentColor`, or pair for each mode)
- [ ] Transition animation when switching (smooth, not jarring)
- [ ] Respect `prefers-reduced-motion`

## Technical approach

### Token architecture

Current `globals.css` uses CSS vars already. Add light mode block:

```css
:root {
  /* dark mode (current) */
  --color-base: #0A0A0A;
  --color-surface: #171717;
  --color-text-primary: #FAFAFA;
  /* ... */
}

[data-theme="light"] {
  --color-base: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-text-primary: #1A1A1A;
  /* ... */
}

[data-accent="blue"]  { --color-accent: #3B82F6; --color-accent-soft: rgba(59,130,246,0.15); }
[data-accent="green"] { --color-accent: #22C55E; --color-accent-soft: rgba(34,197,94,0.15); }
/* ... */
```

### Theme provider

`ThemeContext` in `apps/web/src/lib/theme.tsx`:
```tsx
const { theme, setTheme, accent, setAccent } = useTheme();
// sets data-theme + data-accent on <html>
```

Persist to `StudentProfile` via new fields:
```prisma
model StudentProfile {
  // ...existing
  uiTheme   String @default("system")  // "light" | "dark" | "system"
  uiAccent  String @default("orange")
}
```

### Audit pass

Go through all components that use hardcoded colors — replace with tokens. Key files:
- [dashboard/page.tsx](../../../apps/web/src/app/dashboard/page.tsx) — `rgba(23,23,23,0.85)` backdrop, `#F59E0B`, `#22D3A3` hardcoded → token
- [chat/[id]/page.tsx](../../../apps/web/src/app/chat/[id]/page.tsx)
- [reader/[subjectId]/page.tsx](../../../apps/web/src/app/reader/[subjectId]/page.tsx)

## API design

```ts
PATCH /me/preferences  { uiTheme?, uiAccent? }
```

## UI notes

- Settings UI: theme radio (Light/Dark/System) + accent color swatch row
- Preview chip showing current combination
- Transitions: `transition: background-color 200ms, color 200ms`

## Testing

- Contrast check with axe devtools for both modes
- Visual regression across all pages
- System preference change while app open → updates without refresh
- All 5 accent options visible and legible

## Out of scope

- Full light-mode product photo/illustration refresh
- Custom user-uploaded accent colors
- Seasonal themes (Lunar New Year, Halloween) — can do as events later

## References

- [Smashing Magazine — Inclusive Dark Mode 2025](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)
- [WCAG 2.2 contrast rules](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
