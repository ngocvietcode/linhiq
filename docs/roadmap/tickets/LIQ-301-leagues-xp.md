---
id: LIQ-301
title: Leagues & XP (opt-in social)
phase: 3
priority: P2
estimate: 6d
status: Backlog
depends_on: [LIQ-203]
blocks: []
tags: [backend, frontend, db, gamification, social]
---

# LIQ-301 — Leagues & XP

## Problem

Duolingo's #1 retention mechanism = leagues. LinhIQ hiện chỉ có `streakDays`, không có XP system hay league competition.

Careful: teen Việt có thể dễ bị áp lực điểm số — **opt-in** rất quan trọng. Cả privacy (pseudonym) và mental health (không push nếu thua liên tục).

## User story

> Là học sinh lớp 10 giỏi Chem, em muốn compete ẩn danh với cohort same curriculum — mỗi tuần top 3 lên Silver league — nhưng em có thể tắt feature này nếu stress.

## Acceptance criteria

- [ ] Opt-in toggle (default: OFF) in settings — comply with Vietnam teen privacy norms
- [ ] XP earned per action: chat message (5), quiz correct (10), card review (3), new topic mastered (50), diagnostic complete (100)
- [ ] Weekly XP tally resets Monday 00:00 (user TZ)
- [ ] 5 leagues: Bronze, Silver, Gold, Sapphire, Ruby
- [ ] Cohort: ~30 users per league board (same curriculum)
- [ ] Promote top 5 / demote bottom 5 weekly
- [ ] Pseudonymous display name (auto-generated: "CalmOtter42")
- [ ] Cannot see real names/avatars — only pseudonym + league icon
- [ ] Safeguard: if user finishes in demote zone 3 weeks in row → system auto-downgrades mode to "non-competitive practice"
- [ ] Notification: league start, last-day reminder, results

## Technical approach

### Data model

```prisma
model XpEvent {
  id        String   @id @default(cuid())
  userId    String
  action    XpAction
  amount    Int
  refId     String?  // session/card/quiz id
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
}

model LeagueSeason {
  id        String   @id @default(cuid())
  startAt   DateTime
  endAt     DateTime
  curriculum Curriculum
  @@index([endAt])
}

model LeagueBoard {
  id        String   @id @default(cuid())
  seasonId  String
  league    League
  cohortKey String  // hash for balancing
  members   LeagueMember[]
}

model LeagueMember {
  id       String @id @default(cuid())
  boardId  String
  userId   String
  xpThisWeek Int @default(0)
  pseudonym String
  finalRank Int?
  board    LeagueBoard @relation(fields: [boardId], references: [id])
  user     User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([boardId, userId])
}

enum League { BRONZE SILVER GOLD SAPPHIRE RUBY }
enum XpAction { CHAT QUIZ REVIEW TOPIC_MASTERED DIAGNOSTIC PLAN_COMPLETED }
```

### Backend

New module `apps/api/src/modules/league/`:
- `xp.service.ts` — award XP, subscribe to events from chat/quiz/review
- `league.service.ts` — weekly cron `Monday 00:00` to calculate rankings, promote/demote, form new boards

Cohort balancing: hash(userId + seasonId) % N boards per league — randomized.

### Frontend

New tab `/leagues` under main nav (conditional if opted in)
- Current league card with icon + user's rank
- List of 30 members: pseudonym, XP this week, rank
- Days/hours left this week
- History: past placements

Settings: opt-in toggle with clear explanation.

## API design

```ts
GET  /league/current                → { league, rank, members, endsAt, userRank }
POST /league/opt-in
POST /league/opt-out
GET  /league/history                → past seasons with final rank
```

## UI notes

- League badge prominent (Bronze/Silver/.../Ruby) — visual hierarchy
- Top 5 = green highlight (promote zone)
- Bottom 5 = red/amber (demote zone)
- No aggressive notifications — gentle "2 days left, keep going!"

## Testing

- Unit: XP awarding idempotent (don't double-count)
- Cron: weekly rollover correct across timezones
- Load: 10k users → board assignment fast
- Manual: stress test — opt out works, data purged from boards

## Out of scope

- Friend list / direct competition — Phase 3 later
- Cross-league wager / events — not aligned with education brand
- Parental control over league participation (could add if requested)

## References

- [Duolingo leagues deep dive](https://blog.duolingo.com/leagues/)
