---
id: LIQ-102
title: Past Paper Mode (timed exam + mark-scheme grading)
phase: 1
priority: P0
estimate: 8d
status: Backlog
depends_on: [LIQ-101]
blocks: []
tags: [backend, frontend, db, ai, exam-prep]
---

# LIQ-102 — Past Paper Mode

## Problem

LinhIQ hiện chỉ có **generated quiz** từ `quiz.service.ts`. Học sinh IGCSE/A-Level cần luyện past papers thật sự từ Cambridge/Edexcel với đúng timing + được chấm theo mark scheme gốc. Đây là lý do #1 để phụ huynh trả tiền.

Đối thủ: [NeuraGeek](https://neurageek.com/), [Cambridge Assistant](https://cambridgeassistant.com/), [BestGradez](https://bestgradez.com/).

Ingestion đã support `SourceType.PAST_PAPER` và `SourceType.MARK_SCHEME` ([schema.prisma:408-413](../../../packages/database/prisma/schema.prisma#L408-L413)) nhưng không có flow nào sử dụng.

## User story

> Là học sinh A-Level Physics chuẩn bị thi tháng 5, em muốn làm Paper 2 từ May/June 2024 với timer 1h15m, nộp bài viết tay, và nhận điểm theo mark scheme thật — trước khi tốn $30 thuê gia sư kiểm tra.

## Acceptance criteria

- [ ] Admin có thể mark một `Document` là "Paper" hoặc "Mark Scheme" và link 2 cái với nhau qua metadata `{ paperCode, session, year, timeLimit }`
- [ ] Student xem list past papers theo subject + filter theo session/year
- [ ] Start session → timer count-down, lock chat interaction
- [ ] Upload từng question answer (image hoặc text) — giữ draft tự động
- [ ] Submit → AI chấm từng câu theo chunk của paired mark scheme
- [ ] Kết quả: per-question feedback, total score, time spent per question, so sánh với grade boundary
- [ ] Record vào `PastPaperAttempt` (mới) để tracking lịch sử
- [ ] Resume nếu đóng tab (`status: IN_PROGRESS`)
- [ ] Timer hiện tại còn lại + warning khi < 5 phút

## Technical approach

### Data model (Prisma migration)

```prisma
model PastPaperAttempt {
  id              String    @id @default(cuid())
  userId          String
  paperDocumentId String    // Document.id of the paper
  markSchemeId    String?   // Document.id of mark scheme
  startedAt       DateTime  @default(now())
  submittedAt     DateTime?
  timeLimitSec    Int
  status          PastPaperStatus @default(IN_PROGRESS)
  totalScore      Int?
  maxScore        Int?
  gradeBoundary   Json?     // { A*: 85, A: 70, B: 55, ... }
  questions       PastPaperAnswer[]
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  paper           Document  @relation("PastPaperDocs", fields: [paperDocumentId], references: [id])
  markScheme      Document? @relation("MarkSchemeDocs", fields: [markSchemeId], references: [id])

  @@index([userId])
  @@index([status])
}

model PastPaperAnswer {
  id          String   @id @default(cuid())
  attemptId   String
  questionNo  String   // "1a", "2b(ii)"
  studentText String?
  studentImageUrl String?
  awardedMarks Float?
  maxMarks    Int
  aiFeedback  String?
  timeSpentSec Int?
  attempt     PastPaperAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)

  @@index([attemptId])
}

enum PastPaperStatus { IN_PROGRESS SUBMITTED GRADED ABANDONED }
```

Extend `Document`:
```prisma
model Document {
  // existing fields...
  paperCode     String?   // "0625/42"
  examSession   String?   // "May/June 2024"
  timeLimitMin  Int?
  totalMarks    Int?
  gradeBoundary Json?
}
```

### Backend module

New `apps/api/src/modules/past-paper/`:
- `past-paper.controller.ts` — endpoints
- `past-paper.service.ts` — start/save/submit/grade
- `past-paper-grading.service.ts` — AI grading logic

**Grading logic:**
1. For each answer → RAG search trong mark scheme `Document.chunks` với query = `questionNo`
2. Build prompt: `"You are a Cambridge examiner. Question: {q}. Student answer: {a}. Mark scheme: {ms}. Award marks per scheme and provide per-point feedback."`
3. Use `complexQueryModel` (Gemini 2.5 Pro) — higher accuracy
4. Store structured output with function calling for `{ awardedMarks, feedback, flagsForReview }`

### Frontend

New route: `apps/web/src/app/exam/[subjectId]/page.tsx` (papers list)
New route: `apps/web/src/app/exam/attempt/[attemptId]/page.tsx` (exam interface)

Exam interface:
- Sticky top bar with timer + Submit button
- Paper view on left (reuse Reader component from `/reader/[subjectId]`)
- Answer panel on right with question number selector + text/image upload
- Auto-save draft every 30s (debounced)

Results screen: score card + per-question expandable cards.

## API design

```ts
GET    /past-paper/subjects/:subjectId       // list papers
POST   /past-paper/attempts                  // { paperDocumentId } → { attemptId }
PATCH  /past-paper/attempts/:id/answers      // { questionNo, text?, imageUrl? }
POST   /past-paper/attempts/:id/submit       // triggers grading
GET    /past-paper/attempts/:id              // with questions
GET    /past-paper/attempts                  // history for user
```

## UI notes

- Timer style: prominent mono font, turn red < 5min
- Question nav: grid 1a, 1b, 2a... with tick when answered
- Flag for review toggle per question
- Distraction-free: hide sidebar during active attempt
- Mobile: fullscreen modal, prevent accidental nav away (beforeunload)

## Testing

- Unit: grading with known mark scheme chunk → expected score range
- E2E: full flow start → answer → submit → view results
- Stress: 20 concurrent attempts, grading takes < 30s each
- Manual: verify grading quality with known Cambridge papers

## Out of scope

- Multiple attempts comparison
- Examiner-style written report generation (Phase 2 if demand)
- Question-by-question time benchmarks vs. cohort (Phase 3)

## References

- [Cambridge IGCSE mark scheme format](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/)
- LIQ-101 (image upload dependency)
