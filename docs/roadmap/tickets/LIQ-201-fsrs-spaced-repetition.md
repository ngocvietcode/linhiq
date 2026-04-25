---
id: LIQ-201
title: FSRS Spaced Repetition System
phase: 2
priority: P1
estimate: 8d
status: Backlog
depends_on: [LIQ-105]
blocks: [LIQ-203]
tags: [backend, frontend, db, ai, retention]
---

# LIQ-201 — FSRS Spaced Repetition System

## Problem

Ebbinghaus: học sinh quên 70% thông tin trong 24h nếu không review đúng chu kỳ. LinhIQ dạy tốt trong moment nhưng **không có cơ chế củng cố dài hạn**.

Competitors đã có:
- **Quizlet** — Magic Notes → AI flashcard
- **Seneca** — memory science quizzes
- **Anki/MintDeck** — FSRS algorithm (20-30% ít review hơn SM-2 cùng retention)

Moat: AI tự **mint card từ chat conversation** — không có app nào làm hoàn chỉnh cái này cho curriculum content.

## User story

> Là học sinh A-Level Chem, em muốn Linh tự tạo flashcard từ những concept em vừa học trong chat, rồi mỗi sáng nhắc em review đúng 10 card đang sắp quên — không phải tự tạo Anki deck.

## Acceptance criteria

- [ ] Model `ReviewCard` với FSRS fields (difficulty, stability, retrievability, dueAt)
- [ ] AI tự mint card khi: (a) user accept Socratic L5 near-answer, (b) correct quiz answer sau 2+ sai, (c) manual "Save as card" trong chat
- [ ] Card gồm: front (question/prompt), back (answer + explanation), topicId, source (session/quiz/manual)
- [ ] Daily review screen: show N due cards, 4 grades (Again/Hard/Good/Easy) per FSRS
- [ ] Algorithm implementation dùng `ts-fsrs` npm package
- [ ] Stats: retention rate, cards learned/mature, streak-dependent review load
- [ ] Widget trên dashboard: "12 cards due today"
- [ ] Notification (qua LIQ-105): "Time to review 8 cards — 5 min"
- [ ] Bulk add from textbook: user select range trong Reader → "Make flashcards" → AI generate
- [ ] Edit/delete/suspend card

## Technical approach

### Data model

```prisma
model ReviewCard {
  id             String   @id @default(cuid())
  userId         String
  topicId        String?
  subjectId      String?
  front          String
  back           String
  source         CardSource
  sourceRef      String?   // chatMessageId, quizQuestionId, textbookPageRef
  
  // FSRS state
  difficulty     Float    @default(0)
  stability      Float    @default(0)
  retrievability Float    @default(0)
  reps           Int      @default(0)
  lapses         Int      @default(0)
  state          CardState @default(NEW)
  lastReviewed   DateTime?
  dueAt          DateTime @default(now())
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  reviews        CardReview[]
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic          Topic?   @relation(fields: [topicId], references: [id])

  @@index([userId, dueAt])
  @@index([userId, topicId])
}

model CardReview {
  id           String   @id @default(cuid())
  cardId       String
  grade        Int      // 1=Again 2=Hard 3=Good 4=Easy
  elapsedDays  Float
  scheduledDays Float
  reviewedAt   DateTime @default(now())
  card         ReviewCard @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId])
}

enum CardSource { CHAT QUIZ MANUAL TEXTBOOK AI_MINED }
enum CardState  { NEW LEARNING REVIEW RELEARNING SUSPENDED }
```

### Backend

New module `apps/api/src/modules/review/`:
- `review.service.ts` — wraps `ts-fsrs`
- `card-miner.service.ts` — AI logic to generate cards from chat

Card mining prompt (in `@linhiq/ai-config/src/prompts/card-miner.ts`):
```
Given this tutoring conversation about {topic}, extract 1-3 atomic flashcards that test the key concept just learned. Each card should:
- Have a single focused question on front
- Have a complete answer (1-2 sentences) on back
- Not reference the conversation itself
- Be standalone testable
Return JSON: [{front, back}, ...]
```

Trigger: async job sau khi session có assistant message mà user reply positive ("thanks!", "got it", or passes mini-check).

### Frontend

New route: `/review` — daily review queue
- Card flip animation (3D rotate)
- Grade buttons at bottom (Again / Hard / Good / Easy) with interval preview
- Keyboard shortcut: space = show back, 1-4 = grade

Dashboard widget: "X cards due · review now"

Reader integration: text selection popup → "Make flashcard" button

## API design

```ts
GET  /review/queue?limit=20              → ReviewCard[] due now
POST /review/cards                       { front, back, topicId? }
POST /review/cards/:id/grade             { grade: 1-4 }
GET  /review/stats                       → retention, mature count, review load forecast
POST /review/cards/generate-from-session { sessionId }  // trigger AI mining
DELETE /review/cards/:id
PATCH /review/cards/:id/suspend
```

## UI notes

- Card visual: Anki-inspired but softer (Claude design language)
- Progress bar: "12 / 30 reviewed"
- Celebrate at end: "Session complete! See you tomorrow 🎉" (triggers LIQ-308)
- Forecast graph: cards due in next 7/30 days (avoid overwhelm)

## Testing

- Unit: FSRS scheduling produces expected intervals given grade history
- Integration: mine 20 chat sessions → cards quality review (human)
- E2E: full review session with varied grades

## Out of scope

- Shared decks / community decks (Phase 3)
- Image occlusion cards
- Cloze deletion beyond simple fill-blank

## References

- [ts-fsrs npm](https://www.npmjs.com/package/ts-fsrs)
- [FSRS algorithm benchmark](https://github.com/open-spaced-repetition/srs-benchmark)
- [Why Spaced Repetition Works](https://domenic.me/fsrs/)
