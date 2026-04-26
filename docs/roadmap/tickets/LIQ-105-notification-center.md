---
id: LIQ-105
title: Notification Center (Bell icon → real drawer)
phase: 1
priority: P0
estimate: 3d
status: In Progress
depends_on: []
blocks: []
tags: [backend, frontend, db, engagement]
---

## Status (2026-04-26)

Bell drawer + DB model + producer hooks (mastery / streak / parent fan-out / chat redirect) đã ship. Còn nợ: filter tabs, cron jobs (streak reminder, exam countdown, inactivity), Web Push, notification preferences settings, type enum chuẩn hoá (hiện dùng string `"success" | "warning"` thay vì enum trong AC).

# LIQ-105 — Notification Center

## Problem

Bell icon tại [dashboard/page.tsx:222](../../../apps/web/src/app/dashboard/page.tsx#L222) không có handler — click không làm gì. Không có bảng notification nào trong DB.

Seneca, Duolingo đều dùng notification (streak reminder, "you haven't studied in 2 days") để tăng DAU. Thiếu cái này = mất retention.

## User story

> Là học sinh, em muốn được nhắc khi streak sắp mất, khi weekly report của con ready (parent), khi flashcard đến hạn ôn, khi có tin nhắn từ phụ huynh.

## Acceptance criteria

- [x] Bell icon → dropdown drawer với danh sách notification ([NotificationBell.tsx](../../../apps/web/src/components/NotificationBell.tsx))
- [x] Badge số notification unread (poll mỗi 60s)
- [ ] Filter tabs: All / Mentions / System — chưa làm
- [x] Click notification → navigate tới link, mark as read
- [x] "Mark all as read" button
- [ ] Backend notification types enum chuẩn hoá — hiện đang dùng string tự do (`"success"`, `"warning"`); `Notification.type` là `String` chứ chưa phải `NotificationType` enum
- [x] Producer hooks đã wire: mastery 80%+ và streak milestone trong [progress.service.ts](../../../apps/api/src/modules/progress/progress.service.ts), concerning chat trong [chat.service.ts](../../../apps/api/src/modules/chat/chat.service.ts), parent fan-out qua [`NotificationService.notifyParents`](../../../apps/api/src/modules/notification/notification.service.ts)
- [ ] Cron workers (streak reminder 18h, exam countdown 8h, inactivity ≥3 ngày) — chưa làm
- [ ] Push notification qua Web Push API — chưa làm
- [ ] Settings page: toggle mỗi loại notification on/off (cần `NotificationPreference` model) — chưa làm

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
