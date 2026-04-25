---
id: LIQ-209
title: Persistent Learner Memory v2 (Summary + Profile)
phase: 2
priority: P1
estimate: 5d
status: Backlog
depends_on: []
blocks: [LIQ-203]
tags: [backend, ai, db, personalization]
---

# LIQ-209 — Persistent Learner Memory v2

## Problem

Hiện trạng: [TopicProgress](../../../packages/database/prisma/schema.prisma) chỉ track mastery score per topic. Mỗi chat session bắt đầu từ con số 0 — Linh không nhớ:
- Học sinh thích cách giải thích nào (visual / formal / analogy)
- Đã từng hiểu sai khái niệm gì (vd: nhầm vận tốc với gia tốc)
- Mục tiêu thi (IGCSE 9A*, A-Level Math A* để vào RMIT)
- Ngôn ngữ ưa thích (mix EN/VI hay full VI)

Hệ quả: Linh giải thích lại từ đầu mỗi session, thiếu cá nhân hoá, học sinh phải "nhắc lại context" — trải nghiệm rời rạc.

DeepTutor có 2 dimension memory: `Summary` (digest topic đã học) + `Profile` (preferences + knowledge level). Mình cần tương đương nhưng gắn chặt với schema hiện tại.

## User story

> Là học sinh dùng Linh đều đặn 3 tháng, em mở chat mới và Linh nói: "Hôm trước em đang luyện đạo hàm hàm hợp, vẫn còn lúng túng quy tắc chuỗi. Hôm nay tiếp chỗ đó, hay chuyển sang tích phân?". Em không phải giải thích lại mình là ai.

## Acceptance criteria

- [ ] Bảng mới `LearnerMemory` (1-1 với User) chứa `profileJson` + `summaryJson`
- [ ] Background job tổng hợp memory sau mỗi `ChatSession.endedAt` (Bull queue)
- [ ] Profile auto-extract: learning style, preferred language mix, exam target, knowledge gaps
- [ ] Summary: rolling 30-day digest (top topics, mastery delta, recurring confusions)
- [ ] Memory được inject vào Socratic prompt qua block `<learner_context>...</learner_context>`
- [ ] User có trang `/settings/memory` để xem + edit + clear memory (GDPR-friendly)
- [ ] Memory size cap: profile ≤ 2KB, summary ≤ 4KB (tránh prompt bloat)
- [ ] Audit log mỗi lần memory được update (ai/khi nào/diff)

## Technical approach

### Schema

```prisma
model LearnerMemory {
  id           String   @id @default(cuid())
  userId       String   @unique
  profileJson  Json     // { learningStyle, language, examTarget, strengths, weaknesses }
  summaryJson  Json     // { recentTopics[], confusions[], lastUpdatedTopics[] }
  version      Int      @default(1)
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model LearnerMemoryAudit {
  id        String   @id @default(cuid())
  userId    String
  diff      Json
  reason    String   // "session_end" | "manual_edit" | "auto_refresh"
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
}
```

### Update pipeline

```ts
// apps/api/src/modules/memory/memory.service.ts
async updateAfterSession(sessionId: string) {
  const session = await loadSessionWithMessages(sessionId);
  const currentMem = await this.get(session.userId);
  const llmInput = {
    currentProfile: currentMem.profileJson,
    currentSummary: currentMem.summaryJson,
    transcript: this.compressMessages(session.messages),    // last 20 turns
    progressDelta: await this.getProgressDelta(session.userId, session.startedAt),
  };
  const updated = await ai.updateMemory(llmInput);          // Gemini Flash JSON mode
  await this.save(session.userId, updated, "session_end");
}
```

### Prompt injection

[packages/ai-config/src/prompts/socratic.ts](../../../packages/ai-config/src/prompts/socratic.ts) thêm block:

```
<learner_context>
{{summary}}
Learning style: {{style}}
Known weaknesses: {{weaknesses}}
Exam target: {{examTarget}}
</learner_context>
```

Token cost: ~500 token/turn — chấp nhận được, đổi lại personalisation.

### Privacy

- User có thể xem JSON raw + edit field hoặc bấm "Clear all memory"
- Hard delete khi User soft-delete account
- Không lưu PII (email, address) — chỉ learning-related data
- Field `language` lấy từ chat behavior, không từ profile address

## API design

```
GET    /memory              → { profile, summary, version, updatedAt }
PATCH  /memory/profile      { learningStyle?, examTarget?, ... }
DELETE /memory              → reset
POST   /memory/refresh      → trigger manual rebuild (rate-limited 1/day)
```

## UI notes

- `/settings/memory` page: 2 cột — Profile (editable form) + Summary (read-only, "Refresh" button)
- Onboarding step 3 (sau LIQ-307): pre-seed profile từ diagnostic
- Tooltip trên chat avatar: "Linh đang nhớ X về em" (transparency)

## Testing

- Unit: memory updater handles empty/partial JSON gracefully
- E2E: học sinh chat 3 lần về đạo hàm → session 4 mở ra Linh đề cập đạo hàm
- Privacy: clear memory → next chat không còn personalisation
- Token budget: prompt với memory ≤ 2k token overhead

## Out of scope

- Vector memory (semantic recall của old conversations) — Phase 3
- Sharing memory với teacher/parent — Phase 3 (privacy review trước)
- Multi-language profile (em học IELTS English vs em học Hoá VN) — Phase 3

## References

- DeepTutor "Persistent Memory" architecture (Apache-2.0): https://github.com/HKUDS/DeepTutor
- ChatGPT memory UX pattern (transparency, edit, delete)
