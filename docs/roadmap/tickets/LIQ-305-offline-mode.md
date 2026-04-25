---
id: LIQ-305
title: Offline mode (download books + flashcards)
phase: 3
priority: P2
estimate: 8d
status: Backlog
depends_on: [LIQ-304, LIQ-201]
blocks: []
tags: [mobile, infrastructure, performance]
---

# LIQ-305 — Offline Mode

## Problem

Nhiều học sinh VN đi lại (xe bus, tàu điện) hoặc nhà không có wifi ổn định. Đối thủ offline-capable = Anki, Duolingo.

Cần: đọc textbook pages (images), review flashcards, làm quiz đã tải — không cần mạng.

## User story

> Là học sinh đi tàu điện từ Thủ Đức xuống Q1 mỗi ngày 40 phút, em muốn tải trước textbook Biology + deck flashcard, review offline rồi sync khi wifi trường.

## Acceptance criteria

- [ ] UI "Download for offline" per book volume + subject
- [ ] Download queue + progress indicator
- [ ] Local storage: SQLite (expo-sqlite) for cards/metadata, FileSystem for images
- [ ] Offline indicator in app header
- [ ] Read book pages offline
- [ ] Review flashcards (LIQ-201) offline with local FSRS
- [ ] Take pre-downloaded quizzes offline
- [ ] Sync queue: record grades/results locally → push to server when online
- [ ] Conflict resolution: server wins on card state, user wins on content
- [ ] Storage management: user can see size, delete per subject
- [ ] No chat with Linh offline (too complex, requires LLM)

## Technical approach

### Mobile-only (part of LIQ-304)

Storage layout:
```
/documents/
  books/{bookVolumeId}/
    metadata.json
    page-0001.webp
    page-0002.webp
  cards/{subjectId}.db  (SQLite)
  sync-queue.json
```

Download flow:
1. Fetch book metadata + image URLs
2. Batch download with concurrency limit (4)
3. Store in `FileSystem.documentDirectory`
4. Register in SQLite index
5. Update UI

Sync flow on reconnect:
1. Read `sync-queue.json`
2. POST pending card reviews to `/review/cards/:id/grade`
3. Push quiz attempts
4. Pull new cards/updates from server

### Local FSRS

Reuse `ts-fsrs` — same package works offline. SQLite schema mirrors server's `ReviewCard` + `CardReview`.

## API design

```ts
GET /books/:id/download-manifest   → { pages: [{ url, hash, size }], totalSize }
POST /sync/card-reviews            { reviews: [{ cardId, grade, reviewedAt }] }
GET  /sync/changes?since=ISO       → server-side updates to merge
```

## UI notes

- Download button prominent in Reader / subject pages
- Progress bar with cancel option
- Badge "Offline ✓" on downloaded items
- Warning if storage low (< 500MB)

## Testing

- Airplane mode: full feature flow works
- Sync correctness: 100 offline reviews → all make it to server without dup
- Storage: 3 books + 500 cards ~ 200MB reasonable
- Low storage: graceful fail + user-friendly message

## Out of scope

- Offline chat (ML models too big for phone)
- Offline past papers grading (needs AI)
- P2P sync between devices (future)

## References

- [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
