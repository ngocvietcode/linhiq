---
id: LIQ-206
title: Key Term Collection (Pokédex-style)
phase: 2
priority: P1
estimate: 3d
status: Backlog
depends_on: []
blocks: []
tags: [frontend, backend, gamification]
---

# LIQ-206 — Key Term Collection

## Problem

`KeyTermEarned` model đã tồn tại trong schema ([schema.prisma:250-260](../../../packages/database/prisma/schema.prisma#L250-L260)) nhưng **không có UI** và **không có logic ghi dữ liệu**.

Teen respond rất mạnh với collection mechanics (Pokémon, Honkai, v.v.). "You've collected 47/200 IGCSE Biology terms" = powerful retention hook.

## User story

> Là học sinh IGCSE Biology, em muốn thấy Dex of key terms em đã học, unlock card mới khi học Linh dạy concept mới — giống Pokédex.

## Acceptance criteria

- [ ] Backend logic: khi Socratic L3 (Key Terms) complete hoặc user correctly use term 2+ times → insert `KeyTermEarned`
- [ ] Admin curated list: seed `KeyTerm` master table per subject
- [ ] UI page `/collection` per subject: grid of cards (earned = color, unearned = silhouette)
- [ ] Card detail modal: definition, etymology, usage examples, page in textbook, related terms
- [ ] Total progress: "47 / 200 (23%)" per subject
- [ ] Filter: All / Earned / Not yet / Recently earned
- [ ] Share: export "my Biology collection" as image (future — can skip)
- [ ] Notification (via LIQ-105) khi earn term mới
- [ ] Optional: celebrate animation (LIQ-308) first time term earned

## Technical approach

### Data model

Extend existing `KeyTermEarned`; add new master table:

```prisma
model KeyTerm {
  id          String  @id @default(cuid())
  subjectId   String
  term        String
  termVi      String?
  definition  String
  definitionVi String?
  etymology   String?
  aliases     String[]
  rarity      Rarity  @default(COMMON)  // fun: COMMON/UNCOMMON/RARE/LEGENDARY for hard concepts
  topicId     String?
  orderIndex  Int     @default(0)
  subject     Subject @relation(fields: [subjectId], references: [id])
  topic       Topic?  @relation(fields: [topicId], references: [id])

  @@unique([subjectId, term])
  @@index([subjectId])
}

// existing KeyTermEarned: add FK to KeyTerm instead of free-form `term`
model KeyTermEarned {
  // ...existing
  keyTermId String
  keyTerm   KeyTerm @relation(fields: [keyTermId], references: [id])
}

enum Rarity { COMMON UNCOMMON RARE LEGENDARY }
```

### Seed

Script to populate ~100-200 key terms per subject per curriculum. Can AI-generate first pass from textbook ToC + glossary, then human review.

### Backend detection

In `ai.service.ts` post-response hook:
1. Extract entities using small model or regex
2. Match against `KeyTerm` table (fuzzy)
3. If match + user hasn't earned yet + evidence of correct use → insert `KeyTermEarned`
4. Trigger notification

Alternatively: at Socratic L3 completion, the AI already surfaces key terms — explicitly mark those as earned when user engages.

### Frontend

New route: `apps/web/src/app/collection/[subjectId]/page.tsx`
- CSS grid 3-4 cols mobile, 6-8 desktop
- Earned card: iconEmoji/illustration + term name + rarity border
- Unearned: `filter: grayscale(1) opacity(0.3)` silhouette + "???"
- Click → modal
- Smooth entry animation first render

## API design

```ts
GET /collection/:subjectId            → { terms: [{term, earned, earnedAt?, rarity}], totalEarned, total }
GET /collection/term/:keyTermId       → full details
```

## UI notes

- Rarity color accents: common=gray, uncommon=green, rare=blue, legendary=orange (match accent)
- Slight 3D tilt on hover (CSS transform)
- Pokédex-ish but clean, not childish — target is 14-18
- Celebration (LIQ-308) for LEGENDARY unlock: enhanced animation

## Testing

- Unit: entity detection doesn't false-positive common words
- Integration: earning logic deterministic given same chat history
- Visual: gradient/outline looks right in dark mode
- Seed quality review: terms relevant for IGCSE Year 10-11

## Out of scope

- User-added custom terms (teacher would use — Phase 3)
- Leaderboard for most terms collected (Phase 3, tie to LIQ-301)
- Animation per rarity on unlock — basic version now, polished in LIQ-308

## References

- Design inspo: Honkai Star Rail character dex, Pokémon Pokédex
