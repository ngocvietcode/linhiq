---
id: LIQ-105
title: Notification Center (Bell icon → real drawer)
phase: 1
priority: P0
estimate: 3d
status: Backlog
depends_on: []
blocks: []
tags: [backend, frontend, db, engagement]
---

# LIQ-105 — Notification Center

## Problem

Bell icon tại [dashboard/page.tsx:222](../../../apps/web/src/app/dashboard/page.tsx#L222) không có handler — click không làm gì. Không có bảng notification nào trong DB.

Seneca, Duolingo đều dùng notification (streak reminder, "you haven't studied in 2 days") để tăng DAU. Thiếu cái này = mất retention.

## User story

> Là học sinh, em muốn được nhắc khi streak sắp mất, khi weekly report của con ready (parent), khi flashcard đến hạn ôn, khi có tin nhắn từ phụ huynh.

## Acceptance criteria

- [ ] Bell icon → dropdown drawer (desktop) / bottom sheet (mobile) với danh sách notification
- [ ] Badge số notification unread
- [ ] Filter tabs: All / Mentions / System
- [ ] Click notification → navigate tới related resource, mark as read
- [ ] "Mark all as read" button
- [ ] Backend notification types: `STREAK_REMINDER`, `QUIZ_DUE`, `REVIEW_DUE` (depends on LIQ-201), `PARENT_MESSAGE`, `EXAM_COUNTDOWN` (LIQ-204), `ACHIEVEMENT_UNLOCKED` (LIQ-308)
- [ ] Cron workers để generate notification (streak, exam countdown)
- [ ] Push notification qua Web Push API (nếu user opt-in)
- [ ] Settings page: toggle mỗi loại notification on/off

## Technical approach

### Data model

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  actionUrl String?
  metadata  Json?    // { topicId, sessionId, ... }
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  readAt    DateTime?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([createdAt])
}

enum NotificationType {
  STREAK_REMINDER
  QUIZ_DUE
  REVIEW_DUE
  PARENT_MESSAGE
  EXAM_COUNTDOWN
  ACHIEVEMENT_UNLOCKED
  SYSTEM_ANNOUNCEMENT
}

model NotificationPreference {
  userId       String @id
  streak       Boolean @default(true)
  quizDue      Boolean @default(true)
  reviewDue    Boolean @default(true)
  parentMsg    Boolean @default(true)
  examCountdown Boolean @default(true)
  pushEnabled  Boolean @default(false)
  pushEndpoint String?  // Web Push subscription
  pushKeys     Json?
  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Backend

New module `apps/api/src/modules/notification/`:
- CRUD endpoints
- `NotificationProducerService` with typed helpers: `createStreakReminder(userId)`, etc.
- Cron jobs:
  - `@Cron('0 18 * * *')` — streak reminder nếu hôm nay chưa học + streak >= 3
  - `@Cron('0 8 * * *')` — exam countdown (7 ngày, 3 ngày, 1 ngày trước)

### Frontend

New component `components/notification/NotificationDrawer.tsx`:
- Poll `/notifications?unread=true` every 60s (or SSE for realtime — nice-to-have)
- Replace bell button in [dashboard/page.tsx](../../../apps/web/src/app/dashboard/page.tsx) + [progress/page.tsx](../../../apps/web/src/app/progress/page.tsx) + chat header
- Reuse across mobile/desktop layouts

Web Push setup:
- Service worker `public/sw.js` — register push subscription
- Settings page: "Enable browser notifications" button → `Notification.requestPermission()` → save subscription

## API design

```ts
GET    /notifications?unread=true&limit=20  → Notification[]
POST   /notifications/:id/read
POST   /notifications/read-all
GET    /notifications/preferences
PATCH  /notifications/preferences
POST   /notifications/push-subscribe        { endpoint, keys }
```

## UI notes

- Drawer: max-width 400px, right-aligned on desktop
- Each item: icon (by type), title (bold), body (1-2 lines), relative time ("2h ago"), unread dot
- Empty state: "You're all caught up! 🎉"
- Loading skeleton for initial fetch
- Smooth slide-in animation (spring, 300ms)

## Testing

- Unit: cron job logic (streak reminder triggers only when applicable)
- E2E: create notif → appears in drawer → click → navigates + marks read
- Manual: web push works on Chrome/Safari/Firefox

## Out of scope

- Mobile native push (needs LIQ-304)
- Rich media in notifications (images, actions) — future
- Notification batching/digest — Phase 2 if spammy

## References

- [Web Push with VAPID](https://web.dev/articles/push-notifications-overview)
