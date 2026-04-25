---
id: LIQ-306
title: Voucher / Scholarship engine
phase: 3
priority: P2
estimate: 5d
status: Backlog
depends_on: []
blocks: []
tags: [backend, frontend, growth, billing]
---

# LIQ-306 — Scholarship / Voucher Engine

## Problem

Thị trường VN có khoảng cách thu nhập lớn. Có học sinh giỏi nhưng không trả được PRO tier. Nếu vừa monetize vừa tạo good-will qua scholarship (ví dụ: streak 30 ngày → 1 tháng PRO free) thì vừa growth vừa brand.

Hiện không có billing/voucher system.

## User story

> Là học sinh có streak 30 ngày, em muốn unlock 1 tháng PRO free — cảm thấy effort được reward. Hoặc em có voucher code từ giáo viên.

## Acceptance criteria

- [ ] `VoucherCode` + `Redemption` model
- [ ] Types: STREAK_REWARD, REFERRAL, SCHOOL_GRANT, PROMO, SCHOLARSHIP
- [ ] Admin tạo voucher (bulk or single, expiry, usage cap)
- [ ] Student redeem via code or auto-grant (cron on streak milestone)
- [ ] `Subscription` model: FREE, PRO, PRO_TRIAL, SCHOOL_PRO
- [ ] UI: "My Subscription" page với history
- [ ] Upgrade modal when hit FREE limit (10 msg/day from `SystemSetting.rateLimitFree`)
- [ ] Referral: user shares code → friend signs up + completes onboarding → both get 2 weeks PRO
- [ ] Anti-fraud: 1 redemption per user, code hashed

## Technical approach

### Data model

```prisma
model Subscription {
  id        String   @id @default(cuid())
  userId    String   @unique
  tier      SubTier
  startedAt DateTime @default(now())
  expiresAt DateTime?
  source    SubSource
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VoucherCode {
  id          String   @id @default(cuid())
  code        String   @unique
  type        VoucherType
  tier        SubTier
  durationDays Int
  usageCap    Int      @default(1)
  usedCount   Int      @default(0)
  expiresAt   DateTime?
  metadata    Json?
  createdAt   DateTime @default(now())
  redemptions Redemption[]
}

model Redemption {
  id        String @id @default(cuid())
  voucherId String
  userId    String
  redeemedAt DateTime @default(now())
  voucher   VoucherCode @relation(fields: [voucherId], references: [id])
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([voucherId, userId])
}

model ReferralCode {
  userId   String @unique
  code     String @unique
  uses     Int    @default(0)
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum SubTier { FREE PRO PRO_TRIAL SCHOOL_PRO }
enum SubSource { SELF_PAID VOUCHER SCHOLARSHIP SCHOOL_LICENSE REFERRAL }
enum VoucherType { STREAK_REWARD REFERRAL SCHOOL_GRANT PROMO SCHOLARSHIP }
```

### Backend

New module `apps/api/src/modules/billing/`:
- Voucher CRUD (admin)
- Redemption endpoint (student)
- Cron: daily check for streak milestones (7, 30, 100 days) → auto-grant voucher
- Rate limit enforcement using `Subscription.tier`

### Frontend

- Settings → Subscription tab
- Enter voucher code → instant activation
- Upgrade prompt UI (non-pushy, shows value proposition)
- Referral share screen with QR code

## API design

```ts
GET  /billing/subscription           → current tier + expiry
POST /billing/redeem                 { code } → { success, tier, expiresAt }
GET  /billing/referral               → user's referral code + stats
POST /billing/referral/claim         (called at friend signup completion)

# Admin
POST /admin/vouchers                 { type, tier, durationDays, count, expiresAt }
GET  /admin/vouchers                 → list with usage
```

## UI notes

- Subscription page: clear visual of tier, expiry, "upgrade benefits" if FREE
- Voucher input: success animation (confetti tie-in with LIQ-308)
- Referral: "Give 2 weeks, get 2 weeks" framing

## Testing

- Redemption: same voucher twice by same user → 409
- Expiry: expired code returns clear error
- Streak auto-grant: simulate 30-day streak → voucher issued exactly once
- Fraud: user creating fake accounts for referrals — simple rate limit per device + email verification required

## Out of scope

- Real payment processing (Stripe integration separate ticket)
- Complex promo campaigns (schedule-based, segment-based) — future
- Group buys / family plans — future

## References

- Ties to LIQ-301 streak data, LIQ-308 celebrations
