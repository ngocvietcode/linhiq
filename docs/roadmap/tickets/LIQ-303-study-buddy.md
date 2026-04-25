---
id: LIQ-303
title: Study Buddy / Group chat
phase: 3
priority: P2
estimate: 8d
status: Backlog
depends_on: [LIQ-301]
blocks: []
tags: [backend, frontend, social]
---

# LIQ-303 — Study Buddy / Group Chat

## Problem

Học 1 mình dễ chán. Proven: peer accountability tăng retention. Hiện LinhIQ không có feature social ngoài league.

Rủi ro cao: bullying, off-topic chat, safety — phải design cẩn thận, có moderation bằng Linh làm moderator + existing classifier.

## User story

> Là học sinh IGCSE, em muốn tạo group 3-5 bạn cùng lớp để chat về bài tập, nhờ Linh join group và trả lời câu hỏi chung — như study group ngoài đời.

## Acceptance criteria

- [ ] Opt-in, parent consent for users < 13 (if applicable curriculum)
- [ ] Create group: name + invite up to 8 members
- [ ] Linh persona is a group member by default
- [ ] @mention Linh → AI responds (uses classifier + Socratic)
- [ ] Classifier runs on every message — redirect/warn if safety category
- [ ] Ban/mute within group (admin)
- [ ] Daily message cap per group (anti-spam)
- [ ] Leave group anytime
- [ ] Block user (future)
- [ ] Report message to admin (surfaced in admin moderation queue)
- [ ] Group shared workspace: pinned notes, shared flashcards (opt-in)

## Technical approach

### Data model

```prisma
model Group {
  id          String   @id @default(cuid())
  name        String
  creatorId   String
  subjectId   String?
  curriculum  Curriculum?
  isActive    Boolean  @default(true)
  maxMembers  Int      @default(8)
  createdAt   DateTime @default(now())
  members     GroupMember[]
  messages    GroupMessage[]
}

model GroupMember {
  id       String @id @default(cuid())
  groupId  String
  userId   String
  role     GroupRole @default(MEMBER)
  joinedAt DateTime @default(now())
  mutedUntil DateTime?
  group    Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user     User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([groupId, userId])
}

model GroupMessage {
  id           String   @id @default(cuid())
  groupId      String
  userId       String?  // null = Linh / system
  content      String
  safeCategory TopicCategory?
  isRedacted   Boolean  @default(false)
  reportCount  Int      @default(0)
  createdAt    DateTime @default(now())
  group        Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  @@index([groupId, createdAt])
}

enum GroupRole { ADMIN MEMBER }
```

### Backend

New module `apps/api/src/modules/group/`:
- WebSocket gateway for realtime (use NestJS `@WebSocketGateway`)
- Message pipeline: classify → if HARMFUL/AGE_BOUNDARY → redact + warn
- AI mention detection → trigger Socratic response
- Rate limit: 30 messages/min per user

### Frontend

New route `/groups`, `/groups/:id`
- WebSocket connection
- Standard group chat UI
- Member list sidebar
- Pinned notes section (markdown)
- Linh avatar distinctive (accent color ring)

## API design

```ts
POST   /groups                          { name, subjectId? }
POST   /groups/:id/members              { userIds }
DELETE /groups/:id/members/:userId
GET    /groups/:id/messages?before=ISO&limit=50
POST   /groups/:id/messages             { content }     (WS preferred)
POST   /groups/:id/messages/:msgId/report
POST   /groups/:id/leave
```

## UI notes

- Distinguish Linh messages visually (subtle accent bg)
- Redacted messages: "Hidden by Linh — please keep discussion academic"
- Typing indicator, read receipts (optional)

## Testing

- Safety: classifier catches harmful content in real-time
- Abuse: rate limit blocks spam
- Privacy: non-member cannot read messages
- Scale: 100 concurrent groups with 10 msg/sec

## Out of scope

- Video/voice group calls (not our focus)
- File sharing beyond images (future)
- Persistent study rooms with shared docs (future)

## References

- Existing classifier in `ai.service.ts`
- WS reference: [NestJS Gateways](https://docs.nestjs.com/websockets/gateways)
