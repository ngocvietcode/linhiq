---
id: LIQ-103
title: Wire parent dashboard vào API thật
phase: 1
priority: P0
estimate: 3d
status: Backlog
depends_on: []
blocks: []
tags: [backend, frontend, api]
---

# LIQ-103 — Real Parent Dashboard

## Problem

Parent dashboard tại [apps/web/src/app/parent/page.tsx](../../../apps/web/src/app/parent/page.tsx) hiện dùng **100% mock data hardcoded** ([lines 19-44](../../../apps/web/src/app/parent/page.tsx#L19-L44)). Không có API endpoint phía backend phục vụ phụ huynh.

Schema đã có `ParentChild` link ([schema.prisma:48-57](../../../packages/database/prisma/schema.prisma#L48-L57)), `StudySession`, `TopicProgress`, `SessionTopicStat` — đủ data để build dashboard thật.

Phụ huynh là người ra quyết định chi tiêu. Mock data = không bao giờ convert.

## User story

> Là phụ huynh của Minh (IGCSE Year 10), tôi muốn mỗi tuần nhận email tóm tắt con đã học bao nhiêu giờ, môn nào tiến bộ, môn nào yếu — và có thể mở app xem chi tiết khi muốn.

## Acceptance criteria

- [ ] Endpoint `GET /parent/children` — list children linked qua `ParentChild`
- [ ] Endpoint `GET /parent/reports/:childId/overview` — stats tuần
- [ ] Endpoint `GET /parent/reports/:childId/activity?limit=20` — timeline
- [ ] Endpoint `GET /parent/reports/:childId/subjects` — mastery per subject
- [ ] `/parent/page.tsx` replace 100% mock bằng real data từ API
- [ ] Weekly email digest qua Resend/SendGrid (cron Sunday 7pm)
- [ ] Invite flow: phụ huynh nhập email con → gửi code 6-digit → con nhập code để link
- [ ] Privacy: phụ huynh KHÔNG xem nội dung message chi tiết (chỉ stats + topic categories)
- [ ] Only `PARENT` role có quyền truy cập `/parent/*` routes
- [ ] Fallback UI khi chưa có child linked: "Link your child's account"

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

```ts
GET  /parent/children
GET  /parent/reports/:childId/overview
GET  /parent/reports/:childId/activity
GET  /parent/reports/:childId/subjects
POST /parent/link-requests          { childEmail }
GET  /me/pending-parent-links       // for child to see
POST /me/parent-links/:requestId/approve
POST /me/parent-links/:requestId/reject
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
