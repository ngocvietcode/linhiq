---
id: LIQ-204
title: Exam countdown + syllabus coverage heatmap
phase: 2
priority: P1
estimate: 4d
status: Backlog
depends_on: []
blocks: []
tags: [backend, frontend, db, engagement]
---

# LIQ-204 — Exam Countdown + Syllabus Heatmap

## Problem

Không có gì tạo urgency hơn "16 ngày nữa thi Chemistry — bạn đã cover 62% syllabus". Hiện LinhIQ không có concept of exam date hay syllabus completeness.

Phụ huynh (LIQ-103) cũng cần thông tin này để theo dõi. Teen sẽ respond rất mạnh với visual countdown.

## User story

> Là học sinh IGCSE, em muốn set ngày thi Chemistry 15/5/2026 và nhìn heatmap 30 topic — topic nào đã master, topic nào chưa, rồi Linh tự focus phần còn thiếu.

## Acceptance criteria

- [ ] Setting UI: "Add exam" — select subject, date, session name (e.g. "May/June 2026")
- [ ] Multiple exams per user
- [ ] Dashboard widget: "⏱ 18 days — Biology IGCSE" với progress bar coverage
- [ ] Heatmap: grid of topic cells, color-coded theo mastery
  - Red: <30%, Yellow: 30-70%, Green: >70%
- [ ] Click cell → navigate to topic study session
- [ ] Notification via LIQ-105 at T-30, T-14, T-7, T-3, T-1 days
- [ ] "Study plan" (LIQ-203) tăng focus cho upcoming exam
- [ ] Parent dashboard (LIQ-103) hiển thị exam + coverage

## Technical approach

### Data model

```prisma
model UserExam {
  id          String   @id @default(cuid())
  userId      String
  subjectId   String
  examDate    DateTime @db.Date
  sessionName String?  // "May/June 2026"
  paperCode   String?  // "0610/12"
  targetGrade String?  // "A*", "A", "B"
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subject     Subject  @relation(fields: [subjectId], references: [id])

  @@index([userId, examDate])
}
```

### Backend

New module `apps/api/src/modules/exam/`:
- CRUD endpoints
- `exam.service.ts` method `getCoverageFor(userId, subjectId)`:
  ```ts
  // list all topics in subject
  // join with TopicProgress.masteryLevel
  // return { topics: [{id, name, mastery}], overallPct, masteredCount }
  ```

Integrate with LIQ-105 notification producer (cron daily 8am).

### Frontend

Dashboard: new widget `ExamCountdownWidget`
- Sort by soonest upcoming
- Mini-heatmap preview (max 12 cells), "View full" expands

New route `/exam/:id` full coverage view:
- Heatmap grid (CSS grid, responsive)
- Tooltip on hover: topic name + mastery % + last studied
- Filter/sort by mastery

Settings page: manage exams list.

## API design

```ts
GET    /exam/my                        → UserExam[]
POST   /exam/my                        { subjectId, examDate, sessionName? }
PATCH  /exam/my/:id
DELETE /exam/my/:id
GET    /exam/my/:id/coverage           → { topics, overallPct, daysLeft }
```

## UI notes

- Countdown format:
  - > 30 days: "{N} days"
  - 7-30: "{N} days" accent yellow
  - < 7: red + "Final sprint!"
  - 0: "Exam day — good luck!"
- Heatmap cell: 40x40px min on mobile (thumb friendly)
- Color-blind mode: pattern overlay in addition to color
- Skeleton loading, empty state: "Add your first exam →"

## Testing

- Unit: days calculation correct across timezones (use student profile TZ)
- Integration: coverage % = mastered topics / total topics
- Manual: visual check heatmap on tiny + large subjects

## Out of scope

- Smart "which topic next?" recommendation beyond weakest-first (Phase 3)
- Integration with school exam calendars (Google Calendar, Outlook) — future
- Peer comparison ("your cohort is 74% covered") — Phase 3 if we have scale

## References

- Ties into LIQ-203 study plan weighting, LIQ-105 notifications, LIQ-103 parent view
