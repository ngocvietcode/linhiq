---
id: LIQ-308
title: Celebration moments (confetti + sound)
phase: 3
priority: P2
estimate: 2d
status: Backlog
depends_on: []
blocks: []
tags: [frontend, ux, engagement, micro-delight]
---

# LIQ-308 — Celebration Moments

## Problem

Learning wins hiện phẳng — master topic, hoàn thành quiz 10/10, unlock key term: không có emotional feedback. Duolingo, Khanmigo dùng micro-delight heavily để tạo attachment.

## User story

> Khi em đạt 100% trong quiz khó, em muốn cảm giác "xứng đáng" — animation đẹp, âm thanh nhẹ, xác nhận Linh tự hào về em.

## Acceptance criteria

- [ ] Triggers:
  - Topic mastered (mastery ≥ 0.9)
  - Quiz 100% score
  - Streak milestone (7, 30, 100 days)
  - Level up / promotion in league (LIQ-301)
  - First time earning LEGENDARY key term (LIQ-206)
  - Daily plan complete (LIQ-203)
  - First image tutoring session (LIQ-101)
- [ ] Animation: confetti + scale bounce + message overlay
- [ ] Optional sound effect (toggleable in settings, off by default — respect study environments)
- [ ] Haptic feedback on mobile (LIQ-304)
- [ ] Shareable screenshot: pre-rendered card with achievement
- [ ] Not too frequent — cooldown 5 min per celebration type
- [ ] Varied copy (not always same message) — small template pool

## Technical approach

### Shared utility

`apps/web/src/lib/celebrate.ts`:
```ts
export type CelebrationType = 
  | "topic-mastered"
  | "streak-milestone"
  | "quiz-perfect"
  | "level-up"
  | "plan-complete"
  | "first-image"
  | "legendary-term";

export async function celebrate(type: CelebrationType, payload?: any) {
  if (isOnCooldown(type)) return;
  const copy = pickCopy(type, payload);
  playSound(type);
  vibrate();
  renderConfetti();
  showToast(copy, 3000);
  markCooldown(type);
}
```

Lightweight libs:
- [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) for confetti
- Simple Audio API for sounds (small `.mp3` in `/public/sounds/`)

### Trigger hooks

Wire into existing flows:
- `progress.service.ts` after mastery update
- Quiz submission result
- LIQ-203 plan completion
- etc.

Emit via event bus (Nest) or direct side-effect in handlers.

## UI notes

- Confetti colors: match accent + supporting palette
- Animation max 3-4s, non-blocking UI
- Toast message typography prominent but not gaudy
- Share card design: clean, "LinhIQ — [achievement]" — teens care about aesthetic if sharing

## Testing

- Visual: feels good not annoying (team test)
- Cooldown: same celebration 2x in 3min → second is suppressed
- Settings: sound toggle respected
- Reduced motion: `prefers-reduced-motion` → skip animation, keep toast only

## Out of scope

- Custom celebrations per user theme
- Paid celebration skins (don't monetize joy)

## References

- [canvas-confetti](https://github.com/catdad/canvas-confetti)
