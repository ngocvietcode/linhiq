---
id: LIQ-210
title: Tutor Persona Skills (SKILL.md system)
phase: 2
priority: P1
estimate: 4d
status: Backlog
depends_on: []
blocks: []
tags: [backend, ai, content, admin]
---

# LIQ-210 — Tutor Persona Skills

## Problem

[packages/ai-config/src/prompts/socratic.ts](../../../packages/ai-config/src/prompts/socratic.ts) hard-code 1 persona "Linh — Socratic tutor". Không scale được khi muốn:
- Tutor luyện thi IELTS (focus speaking/writing, không Socratic)
- Tutor giải đề thi đại học VN (style trực tiếp, từng bước)
- Tutor "coach môn Văn" (gợi mở cảm xúc, không đưa đáp án)
- Tutor cho học sinh THPT chuyên vs học sinh trung bình

Hiện nay muốn thêm persona mới = sửa code, redeploy, không có A/B. Admin không tự thêm được.

DeepTutor giải bằng `SKILL.md`: file Markdown frontmatter + body, inject vào system prompt khi active. Mình làm tương tự nhưng quản trị qua DB + admin UI.

## User story

> Là Admin, em vào `/admin/personas`, tạo persona mới "IELTS Speaking Coach" với prompt riêng, gắn với subject "IELTS". Học sinh khi chọn subject IELTS sẽ chat với persona này thay vì Linh mặc định.

> Là học sinh, em thấy dropdown "Tutor style" với 3 lựa chọn: Socratic / Direct / Coach — chọn theo tâm trạng.

## Acceptance criteria

- [ ] Bảng `TutorPersona` với fields: slug, name, description, systemPromptTemplate, hintLevels (Json[]), language, isDefault, subjectIds[]
- [ ] Admin UI `/admin/personas`: list + create + edit + preview (test chat trong sandbox)
- [ ] Persona có `{{learner_context}}`, `{{rag_chunks}}`, `{{hint_level}}` placeholder để runtime fill
- [ ] Per-subject default persona (vd: IELTS → IELTS Coach, Math → Socratic Math)
- [ ] User có thể override persona per session (dropdown trong chat composer)
- [ ] Existing Socratic prompt được seed thành persona `socratic-default`
- [ ] Versioning: mỗi lần edit persona tạo new version, audit log
- [ ] Activation flag — admin có thể disable persona xấu mà không xoá

## Technical approach

### Schema

```prisma
model TutorPersona {
  id                   String         @id @default(cuid())
  slug                 String         @unique
  name                 String
  description          String
  systemPromptTemplate String         @db.Text
  hintLevelsConfig     Json?          // override hint level prompts per persona (optional)
  language             String         @default("auto")    // "vi" | "en" | "auto"
  isActive             Boolean        @default(true)
  isDefault            Boolean        @default(false)
  version              Int            @default(1)
  createdById          String?
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt
  subjects             SubjectPersona[]
  sessions             ChatSession[]
}

model SubjectPersona {
  subjectId  String
  personaId  String
  isDefault  Boolean       @default(false)
  subject    Subject       @relation(fields: [subjectId], references: [id])
  persona    TutorPersona  @relation(fields: [personaId], references: [id])
  @@id([subjectId, personaId])
}

// ChatSession adds:
//   personaId String?
//   persona   TutorPersona? @relation(fields: [personaId], references: [id])
```

### Prompt resolution flow

```ts
// apps/api/src/modules/ai/persona.service.ts
async resolvePersona(sessionId): Promise<ResolvedPersona> {
  const session = await loadSession(sessionId);
  const persona = session.personaId
    ? await db.tutorPersona.findUnique({ id: session.personaId })
    : await this.defaultFor(session.subjectId);
  return this.compile(persona, { rag, learner, hintLevel });
}
```

[ai.service.ts](../../../apps/api/src/modules/ai/ai.service.ts) thay vì import socratic prompt cứng → gọi `personaService.resolvePersona()`.

### Migration plan

1. Tạo bảng + seed `socratic-default` từ nội dung `socratic.ts` hiện tại
2. Tất cả existing `ChatSession` keep `personaId = null` → fallback về default
3. Sau khi stable 1 tuần: delete hard-coded prompt khỏi `socratic.ts`, file chỉ còn type re-exports

### Template engine

Dùng simple `{{var}}` substitution (không cần Handlebars). Whitelist variables: `learner_context`, `rag_chunks`, `hint_level`, `subject_name`, `mode`, `language`. Parser reject biến không whitelist để chống prompt injection từ admin.

## API design

```
GET    /admin/personas
POST   /admin/personas              { name, slug, systemPromptTemplate, ... }
PATCH  /admin/personas/:id
DELETE /admin/personas/:id          (soft, set isActive=false)
POST   /admin/personas/:id/preview  { sampleQuestion } → SSE test response

GET    /chat/personas?subjectId=    → list personas user can pick for that subject
POST   /chat/sessions/:id/persona   { personaId }
```

## UI notes

### Admin
- List view: name, subject count, version, active toggle, "Test" button
- Editor: split-pane, left = template với syntax-highlight, right = preview với sample question
- Validation: require placeholder `{{rag_chunks}}` (force RAG-aware) hoặc explicit opt-out

### Student
- Chat composer: small dropdown "Linh (Socratic)" → click để đổi
- First-time tooltip: "Em có thể chọn cách Linh dạy"
- Mặc định = subject default → no friction

## Testing

- Unit: template compiler rejects unknown placeholders
- Unit: persona resolution priority (session > subject default > global default)
- E2E admin: create persona → use trong chat → response style khác
- A/B safety: feature flag để rollback nếu persona mới degrade UX

## Out of scope

- User-uploaded SKILL.md (security risk) — Phase 3 nếu có nhu cầu
- Persona marketplace (community share) — Phase 3
- Per-persona analytics dashboard — Phase 3

## References

- DeepTutor Skills system (SKILL.md format, Apache-2.0): https://github.com/HKUDS/DeepTutor
- Existing prompt: [socratic.ts](../../../packages/ai-config/src/prompts/socratic.ts)
