---
id: LIQ-103
title: Wire parent dashboard vào API thật
phase: 1
priority: P0
estimate: 3d
status: In Review
depends_on: []
blocks: []
tags: [backend, frontend, api]
---

## Status (2026-04-26)

Dashboard data, drill-down + báo cáo đã wire xong. Link flow đã ship: parent có thể (a) tạo tài khoản mới cho con + auto-link và (b) sinh mã 6 chữ số mời tài khoản đã có; con redeem mã tại `/parent-link`. Còn nợ duy nhất: weekly email digest. Mở rộng vượt scope ban đầu: chat viewer + alerts page (xem ghi chú dưới).

# LIQ-103 — Real Parent Dashboard

## Problem

Parent dashboard tại [apps/web/src/app/parent/page.tsx](../../../apps/web/src/app/parent/page.tsx) hiện dùng **100% mock data hardcoded** ([lines 19-44](../../../apps/web/src/app/parent/page.tsx#L19-L44)). Không có API endpoint phía backend phục vụ phụ huynh.

Schema đã có `ParentChild` link ([schema.prisma:48-57](../../../packages/database/prisma/schema.prisma#L48-L57)), `StudySession`, `TopicProgress`, `SessionTopicStat` — đủ data để build dashboard thật.

Phụ huynh là người ra quyết định chi tiêu. Mock data = không bao giờ convert.

## User story

> Là phụ huynh của Minh (IGCSE Year 10), tôi muốn mỗi tuần nhận email tóm tắt con đã học bao nhiêu giờ, môn nào tiến bộ, môn nào yếu — và có thể mở app xem chi tiết khi muốn.

## Acceptance criteria

- [x] Endpoint `GET /parent/children` — list children linked qua `ParentChild` (kèm `daysSinceLastStudy`, `inactive`, `studyGoal`)
- [x] Endpoint stats tuần — implement tại `GET /parent/children/:childId/overview?days=` và `.../report?days=` (filter 7/30/90)
- [x] Endpoint activity timeline — implement tại `GET /parent/children/:childId/timeline?days=` (mix quiz/mastery/alert/session)
- [x] Endpoint mastery per subject — bao gồm trong overview + drill-down `GET /parent/children/:childId/subjects/:subjectId` (theo Unit/Topic)
- [x] `/parent/page.tsx` replace 100% mock bằng real data từ API
- [ ] Weekly email digest qua Resend/SendGrid (cron Sunday 7pm) — chưa làm
- [x] Invite flow: parent nhập email con → sinh code 6-digit (hash bằng bcrypt, hết hạn 24h) → con nhập code tại `/parent-link` để link. Có thêm flow tạo account mới: `POST /parent/children` tạo `User`+`StudentProfile`+`ParentChild` trong 1 transaction.
- [x] Only `PARENT` role có quyền truy cập `/parent/*` routes (Roles guard)
- [x] Fallback UI khi chưa có child linked: "Hãy liên hệ quản trị viên để liên kết tài khoản"
- [x] **Mở rộng (P0+P1):** parent có thể xem transcript chat + alerts page cho nội dung redirect / EMOTIONAL / MATURE_SOFT / AGE_BOUNDARY / HARMFUL — yêu cầu trực tiếp từ stakeholder, **đảo lại** AC privacy ban đầu
- [x] **Mở rộng:** lịch sử quiz, study-goal editor, inactivity banner (≥3 ngày không học)
- [x] **Mở rộng:** parent notification fan-out — mastery 80%+, streak milestone, concerning chat content (qua `NotificationService.notifyParents`)

## Technical approach

### Backend

New module: `apps/api/src/modules/parent/`
- `parent.controller.ts` with `@Roles(Role.PARENT)` guard
- `parent.service.ts`

Queries:
```ts
async getChildOverview(parentId, childId) {
  // verify ParentChild exists
  // aggregate StudySession (last 7d)
  // get TopicProgress for subjects
  // get SessionTopicStat for category distribution
  // return { studyTime, questionsAsked, correctPct, streak, subjects[] }
}
```

**Weekly digest cron:** use `@nestjs/schedule` with `@Cron('0 19 * * 0')` — aggregate stats, render email with MJML template, send via Resend.

### Frontend

Refactor [parent/page.tsx](../../../apps/web/src/app/parent/page.tsx):
- Replace `STUDENT`, `SUBJECTS`, `ATTENTION`, `RECENT_ACTIVITY` constants with `useEffect` → `api()` calls
- Loading states per section (skeleton)
- Empty states: "Your child hasn't studied this week yet"

New route: `/parent/link-child` — 3-step flow:
1. Enter child email → `POST /parent/link-requests` → sends code
2. Child opens app → sees banner "Parent requests link: approve/deny"
3. On approve → `ParentChild` row inserted

### Data model

Need new table for pending link requests:
```prisma
model ParentLinkRequest {
  id         String   @id @default(cuid())
  parentId   String
  childEmail String
  code       String   // 6 digit, hashed
  status     LinkRequestStatus @default(PENDING)
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@index([childEmail, status])
}

enum LinkRequestStatus { PENDING APPROVED REJECTED EXPIRED }
```

## API design

Đã ship (namespace `/parent/children/:childId/...` thay vì `/parent/reports/:childId/...`):

```ts
GET   /parent/children
GET   /parent/children/:childId/overview?days=                  // 7/30/90
GET   /parent/children/:childId/report?days=
GET   /parent/children/:childId/sessions?days=&onlyConcerning=  // chat list
GET   /parent/children/:childId/sessions/:sessionId             // transcript
GET   /parent/children/:childId/alerts?days=                    // concerning content feed
GET   /parent/children/:childId/quizzes?limit=                  // quiz history
GET   /parent/children/:childId/subjects/:subjectId             // unit/topic drill-down
GET   /parent/children/:childId/timeline?days=                  // mixed events
PATCH /parent/children/:childId/study-goal                      // { goalMin }
```

Link flow (đã ship):

```ts
POST   /parent/children                   // { email, name, password, curriculum } → tạo account + link
POST   /parent/link-requests              // { childEmail } → sinh code 6 chữ số (hết hạn 24h)
GET    /parent/link-requests              // list yêu cầu của parent
DELETE /parent/link-requests/:id          // huỷ yêu cầu
POST   /me/parent-link/redeem             // { code } → child redeem để liên kết
```

## UI notes

- Keep current layout from [parent/page.tsx](../../../apps/web/src/app/parent/page.tsx) — it's good visually
- Add "Last updated" timestamp
- "Download PDF report" button (optional, use react-pdf)
- Attention banner: data-driven (`lastStudyAt` > 3 days ago for subject X with upcoming exam)

## Testing

- Unit: aggregation queries return expected shape
- Integration: parent cannot access non-linked child's data (403)
- E2E: link flow end-to-end
- Manual: verify weekly email arrives, renders correctly in Gmail/Outlook

## Out of scope

- Real-time push notifications to parent (Phase 2)
- In-app messaging parent ↔ child (Phase 3, see LIQ-303)
- Multi-child comparison views
- Parent-teacher communication (Phase 3)

## References

- [Resend docs](https://resend.com/docs)
- [MJML for email](https://mjml.io/)
