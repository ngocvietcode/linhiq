---
id: LIQ-104
title: Adaptive diagnostic onboarding
phase: 1
priority: P0
estimate: 4d
status: Backlog
depends_on: []
blocks: []
tags: [backend, frontend, onboarding, ai]
---

# LIQ-104 — Adaptive Diagnostic Onboarding

## Problem

Onboarding tại [apps/web/src/app/onboarding/page.tsx](../../../apps/web/src/app/onboarding/page.tsx) chỉ có **3 câu Biology hardcoded** ([lines 18-44](../../../apps/web/src/app/onboarding/page.tsx#L18-L44)) — bất kể user chọn curriculum/subject gì. Không adaptive, không lưu `DiagnosticResult`.

Schema đã có `DiagnosticQuestion`, `DiagnosticResult` ([schema.prisma:262-282](../../../packages/database/prisma/schema.prisma#L262-L282)) nhưng **không có data seed** và **không có logic adaptive**.

## User story

> Là học sinh mới, em muốn Linh hỏi em một vài câu đơn giản để biết em đang ở trình độ nào — không lãng phí thời gian học lại thứ em đã biết.

## Acceptance criteria

- [ ] Seed `DiagnosticQuestion` table: 10-15 questions per topic per curriculum (priority: IGCSE Bio/Chem/Maths/Physics trước)
- [ ] Adaptive algorithm: start at medium difficulty, correct → harder, wrong → easier, stop sau 5-8 câu per subject (khi 95% CI estimate)
- [ ] Per-topic initial mastery score → write to `TopicProgress.masteryLevel`
- [ ] Final screen: "Linh đánh giá em đã biết X, nên bắt đầu từ Y"
- [ ] Skip option: "Let me start without a diagnostic" → mastery = 0
- [ ] Results saved to `DiagnosticResult` for admin analytics
- [ ] Diagnostic có thể re-take mỗi 30 ngày (for mastery calibration)

## Technical approach

### Data seeding

New script `packages/database/src/seed-diagnostic.ts`:
- For each Curriculum × Subject × Topic → generate 3-5 DiagnosticQuestion via AI (one-time, human-review)
- Add `difficulty: 1-5` field to `DiagnosticQuestion` (migration)

### Backend

New module `apps/api/src/modules/diagnostic/`:
- `GET /diagnostic/next` — returns next question based on response history
- `POST /diagnostic/answer` — records answer, returns next or done

Adaptive logic (simplified IRT):
```ts
async getNextQuestion(userId, subjectId) {
  const history = await getDiagnosticResults(userId, subjectId);
  if (history.length >= 8 || hasConverged(history)) return null;

  const currentAbility = estimateAbility(history); // 1-5
  // exclude already-asked questions
  return pickQuestionAtDifficulty(currentAbility, asked);
}

function hasConverged(history) {
  // last 3 alternate correct/wrong at same difficulty => converged
}
```

### Frontend

Refactor [onboarding/page.tsx](../../../apps/web/src/app/onboarding/page.tsx):
- Replace step 3 hardcoded questions with fetch loop from `/diagnostic/next`
- Progress bar: "Question X — estimated 5 more"
- Per-subject section (user picks 3 subjects in step 2)
- On last question → `POST /diagnostic/complete` → backend computes initial `TopicProgress`

## API design

```ts
POST /diagnostic/start          { subjectIds: string[] } → { sessionId }
GET  /diagnostic/:sessionId/next → { question, subjectId, index, estimatedTotal } | { done: true, summary }
POST /diagnostic/:sessionId/answer { questionId, selectedIdx, timeSpentMs }
```

## UI notes

- One question fullscreen on mobile, no chrome
- Kế thừa pattern của [onboarding/page.tsx](../../../apps/web/src/app/onboarding/page.tsx) step 3 với 4 options
- After answer → instant feedback (optional: "Too easy? Let's jump ahead")
- Progress: subject tabs at top like a quiz with ticks
- Final summary: radar chart showing per-topic strength

## Testing

- Unit: adaptive algorithm converges with simulated student (know ability = 3, should converge near 3)
- E2E: diagnostic for 3 subjects → TopicProgress rows created
- Quality: review 10 AI-generated questions per topic manually before seed

## Out of scope

- Multi-modal diagnostic (image, voice) — Phase 2
- IRT with proper item parameters — Phase 3 (use heuristic first)
- Diagnostic for prerequisite detection ("you're missing fractions, go back")

## References

- [Adaptive testing — IRT intro](https://en.wikipedia.org/wiki/Item_response_theory)
- [Duolingo placement test pattern](https://blog.duolingo.com/placement-test/)
