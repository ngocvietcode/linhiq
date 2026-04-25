---
id: LIQ-312
title: Zalo / Telegram TutorBot channel
phase: 3
priority: P2
estimate: 10d
status: Backlog
depends_on: [LIQ-209]
blocks: []
tags: [backend, integration, growth, mobile]
---

# LIQ-312 — Zalo / Telegram TutorBot channel

## Problem

Học sinh VN dùng Zalo nhiều hơn web app. Mở browser → login → vào chat = friction. Nếu Linh xuất hiện ngay trong Zalo (hoặc Telegram cho học sinh quốc tế), rate engagement tăng vì:
- Không cần mở app riêng
- Push notification miễn phí (nudge daily study habit)
- Parent có thể nhận report qua chính Zalo

DeepTutor có TutorBot connect Telegram/Discord/Slack. Mình ưu tiên **Zalo OA** (Vietnam-first) + Telegram (international + tech-savvy).

## User story

> Là học sinh THPT, em add "Linh AI Tutor" Zalo OA. Em chụp ảnh bài tập, gửi vào Zalo chat, Linh trả lời gợi ý. Tối Linh nhắc "Hôm nay em chưa ôn Toán, làm 5 câu nhé?" — em làm ngay trong Zalo.

> Là phụ huynh, em add Linh Zalo OA, mỗi Chủ Nhật nhận message tóm tắt tuần học của con.

## Acceptance criteria

- [ ] Zalo OA approved + webhook nhận message
- [ ] Telegram bot @LinhIQTutorBot live
- [ ] Bảng `ChannelLink` map User ↔ (channel, externalId)
- [ ] Linking flow: Zalo user gõ `/link <code>` → web tạo code 6 ký tự → bind
- [ ] Inbound text message → đi qua chat pipeline thường (cùng auth, cùng RAG)
- [ ] Inbound image (Zalo + Telegram) → OCR pipeline (LIQ-101) → chat
- [ ] Outbound proactive nudge (depend LIQ-209 memory): "đã 2 ngày chưa luyện X"
- [ ] Rate limit per channel + spam protection
- [ ] Webhook signature verification (Zalo OA secret + Telegram bot token)
- [ ] Admin dashboard: kênh active, message volume, error rate
- [ ] Setting "Disconnect Zalo/Telegram" trong profile
- [ ] Compliance: privacy notice, opt-in cho proactive messages

## Technical approach

### Channel abstraction

```ts
// apps/api/src/modules/channels/channel.interface.ts
interface ChatChannel {
  name: "zalo" | "telegram" | "web";
  parseInbound(payload): Promise<NormalizedMessage>;
  sendOutbound(externalId, content: OutboundMessage): Promise<void>;
  verifySignature(req): boolean;
}
```

Adapters: `ZaloAdapter`, `TelegramAdapter`, `WebAdapter` (existing).

### Linking flow

1. User logged into web → settings/integrations → "Connect Zalo" → backend tạo `LinkCode` (6 chars, TTL 10 min)
2. User mở Zalo OA, gõ `/link 4F2X9K`
3. Webhook nhận message → match code → bind `ChannelLink { userId, channel: "zalo", externalId: zaloUserId }`
4. Trả lại "Đã kết nối tài khoản LinhIQ của em ✅"

### Inbound flow

```
Zalo webhook → POST /webhooks/zalo
  → ZaloAdapter.parseInbound()
  → if image: enqueue OCR job
  → resolve userId from ChannelLink
  → ChatService.handleMessage(userId, content) [reuse existing pipeline]
  → ZaloAdapter.sendOutbound(externalId, response)
```

### SSE problem on chat channel

Web chat dùng SSE streaming token-by-token. Zalo/Telegram là turn-based — phải gom full response rồi gửi 1 message. Stream events vẫn tồn tại internally, channel adapter buffer + flush khi `done`.

Long messages (>2000 chars) → split tự động Telegram, gộp 1 image/text bubble Zalo.

### Proactive nudges

Cron daily scan users với:
- `lastStudyAt > 48h ago`
- `LearnerMemory.summary` có topic chưa hoàn thành
- User đã opt-in proactive

→ Generate personalized nudge qua AI → send qua bound channel. Quiet hours: không gửi 22:00–08:00 timezone user.

### Rate / abuse

- Inbound: 30 messages/user/giờ qua channel
- Outbound proactive: max 3/tuần/user (chống spam → bị Zalo ban OA)
- Block list: từ "spam", quá nhiều caps, link spam → auto-mute 1h

## Data model

```prisma
model ChannelLink {
  id          String   @id @default(cuid())
  userId      String
  channel     String   // "zalo" | "telegram"
  externalId  String   // Zalo user_id or Telegram chat_id
  isActive    Boolean  @default(true)
  optIns      Json     // { proactive: bool, parentReports: bool }
  linkedAt    DateTime @default(now())
  lastUsedAt  DateTime?
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([channel, externalId])
  @@index([userId])
}

model ChannelLinkCode {
  code      String   @id
  userId    String
  channel   String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  @@index([expiresAt])
}
```

## API design

```
POST /webhooks/zalo            (Zalo OA event)
POST /webhooks/telegram        (Telegram getUpdates → webhook)
POST /channels/link-code       { channel } → { code, expiresAt }
DELETE /channels/:linkId       (disconnect)
GET /channels                  → list bound channels
PATCH /channels/:linkId/opt-ins
```

## Infra / external setup

- Zalo OA registration (cần MST + người đại diện) — chuẩn bị doc trước
- Webhook URL phải HTTPS public — dùng main API domain `/webhooks/...`
- Telegram bot: dễ — chỉ `@BotFather` + token vào env
- ENV: `ZALO_OA_ID`, `ZALO_OA_SECRET`, `ZALO_ACCESS_TOKEN`, `TELEGRAM_BOT_TOKEN`

## UI notes

- Settings → "Tích hợp" tab với card cho từng channel: connected/not, last activity, disconnect
- Onboarding bước cuối: "Add Linh trên Zalo để học mọi lúc" (QR code OA)
- Empty state chat: "Em cũng có thể chat Linh qua Zalo / Telegram"

## Testing

- Unit: webhook signature verification (valid + tampered)
- Unit: link code expires + single-use
- Integration: mock Zalo API → inbound text + image flow → assert outbound called
- E2E: real test account Zalo OA dev mode
- Load: 100 concurrent webhook requests không lỡ message

## Out of scope

- Voice message (Zalo) — Phase 4 (cần STT pipeline)
- Group chat support — Phase 4
- Discord/Slack — Phase 4 (low ROI cho VN market)
- Whatsapp — Phase 4 (cost cao hơn)

## References

- Zalo OA Webhook docs: https://developers.zalo.me/docs/api/official-account-api
- Telegram Bot API: https://core.telegram.org/bots/api
- DeepTutor TutorBot multi-channel (Apache-2.0): https://github.com/HKUDS/DeepTutor
