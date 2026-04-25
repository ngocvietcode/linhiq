---
id: LIQ-203
title: Daily Study Plan generator
phase: 2
priority: P1
estimate: 5d
status: Backlog
depends_on: [LIQ-201]
blocks: []
tags: [backend, frontend, db, ai, engagement]
---

# LIQ-203 — Daily Study Plan

## Problem

Học sinh mở app → "Hôm nay học gì?" — hiện không có gợi ý cụ thể, chỉ thấy subject list. Khanmigo, Duolingo đều generate daily plan.

Có `studyGoal: Int @default(60)` trong `StudentProfile` ([schema.prisma:39](../../../packages/database/prisma/schema.prisma#L39)) — chưa được sử dụng.

## User story

> Là học sinh Year 11 có exam Biology trong 20 ngày, em mở app mỗi sáng và muốn Linh gợi ý hôm nay nên học 60 phút — cụ thể từng task: review 8 card, học topic mới X, làm 5 câu past paper.

## Acceptance criteria

- [ ] Cron 6am daily → generate `StudyPlan` cho mỗi active user
- [ ] Plan balanced: 40% review (LIQ-201 due cards) + 40% new content (weak topics) + 20% practice (quiz/past paper questions)
- [ ] Tổng thời gian ≈ `StudentProfile.studyGoal`
- [ ] Weight theo exam countdown (LIQ-204): gần exam → tỷ lệ practice cao hơn
- [ ] UI: checklist trên dashboard, tick khi hoàn thành
- [ ] "Start today's plan" button → auto-navigate qua các task theo thứ tự
- [ ] Empty completion state: confetti + XP reward (tie to LIQ-301/LIQ-308)
- [ ] User có thể skip task or regenerate plan
- [ ] History: xem plan hôm qua đã làm bao nhiêu

## Technical approach

### Data model

```prisma
model StudyPlan {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date
  items     StudyPlanItem[]
  targetMin Int
  completedMin Int @default(0)
  completedAt DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId])
}

model StudyPlanItem {
  id         String   @id @default(cuid())
  planId     String
  orderIndex Int
  type       PlanItemType
  subjectId  String?
  topicId    String?
  estMin     Int
  metadata   Json?    // { cardIds, quizId, paperDocId, ... }
  completedAt DateTime?
  skippedAt  DateTime?
  plan       StudyPlan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@index([planId])
}

enum PlanItemType {
  REVIEW_CARDS
  NEW_TOPIC
  QUIZ
  PAST_PAPER_QUESTIONS
  CHAT_SESSION
}
```

### Backend

New module `apps/api/src/modules/study-plan/`:
- `plan-generator.service.ts`:
  ```ts
  async generateForUser(userId, date) {
    const goal = studentProfile.studyGoal;
    const dueCards = await reviewService.countDue(userId);
    const weakTopics = await progressService.getWeakTopics(userId, limit=3);
    const upcomingExams = await examService.getUpcoming(userId);
    
    const items = [];
    // 40% review
    if (dueCards > 0) items.push({ type: REVIEW_CARDS, estMin: Math.min(15, dueCards) });
    // 40% new
    for (const topic of weakTopics) items.push({ type: NEW_TOPIC, topicId, estMin: 15 });
    // 20% practice weighted by exam proximity
    if (upcomingExams.length) items.push({ type: PAST_PAPER_QUESTIONS, estMin: 10 });
    
    return createPlan({ userId, date, items, targetMin: goal });
  }
  ```

- Cron: `@Cron('0 6 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })`

### Frontend

Dashboard widget replacing/augmenting "Continue where you left off":
- Card "Today's plan · 60 min" with stacked task items
- Each item tappable → navigate to appropriate surface (chat with topic preloaded, review page, exam attempt)
- Progress ring showing completion %

New page `/plan` for full view + history.

## API design

```ts
GET  /study-plan/today              → StudyPlan with items
GET  /study-plan/history?limit=30   → StudyPlan[]
POST /study-plan/regenerate         → fresh plan
POST /study-plan/items/:id/complete
POST /study-plan/items/:id/skip
```

## UI notes

- Checklist with Apple Reminders-style inline check animation
- Estimated time per item in muted text
- Keep item order logical: review → new → practice
- Empty: "Rest day? Take a break 😌" if user skipped goal for day
- Weekly view: streak of plan completion days

## Testing

- Unit: plan generator distributes time correctly
- Integration: plan generated at 6am TZ-aware
- Manual: review plan quality across 10 test users with varied progress

## Out of scope

- Multi-day plan view (week ahead) — Phase 3
- AI-explained "why this plan": for later when user trust depends on it
- Collaborative plan (student + parent + teacher input) — Phase 3

## References

- Depends on `ReviewCard.dueAt` (LIQ-201)
