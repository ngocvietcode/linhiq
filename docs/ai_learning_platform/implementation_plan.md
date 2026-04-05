# Implementation Plan: LinhIQ — AI Learning Platform (Cambridge RAG)

**Version:** 2.0 — Synchronized with actual codebase (April 2026)
**Status:** Updated to reflect all changes made during development

---

## Tổng Quan Hiện Trạng

> [!IMPORTANT]
> Tài liệu `implementation_plan.md` v1.0 ban đầu (Phase 1–4) được viết trước khi bắt đầu coding, dựa trên các giả định ban đầu. Trong quá trình phát triển, nhiều quyết định kiến trúc đã thay đổi đáng kể. Tài liệu này (v2.0) đã được cập nhật để **phản ánh chính xác trạng thái thực tế của codebase**, loại bỏ các mismatch cũ.

---

## Các Quyết Định Kiến Trúc Đã Thay Đổi So Với Plan v1.0

| # | Plan v1.0 (Cũ) | Thực Tế (Hiện Tại) | Lý Do |
|---|---|---|---|
| 1 | **Python FastAPI** cho AI backend | **NestJS (TypeScript)** monolith duy nhất (`apps/api`) | Tránh quản lý 2 runtime riêng biệt; Vercel AI SDK (`ai` package) cho streaming native trong TypeScript |
| 2 | **LlamaIndex / LangChain** cho RAG | **Custom RAG** bằng pgvector + Vercel AI SDK + `@ai-sdk/google` | Đơn giản hơn, ít dependency, kiểm soát tốt hơn pipeline |
| 3 | **OpenAI GPT-4o** làm LLM chính | **Google Gemini** (gemini-2.5-flash / gemini-2.5-pro) làm mặc định, hỗ trợ fallback OpenAI/Anthropic | API key cá nhân dùng Gemini; multi-provider switching qua Admin Portal |
| 4 | **text-embedding-3-small** (OpenAI) | **gemini-embedding-001** (3072 dims) | Đồng nhất hệ sinh thái Google |
| 5 | **Clerk / Firebase Auth** | **Custom JWT Auth** (bcrypt + jsonwebtoken) | Giảm dependency ngoài, kiểm soát hoàn toàn auth flow |
| 6 | **Redis** cho chat cache | **Không dùng Redis** — query trực tiếp PostgreSQL | Đơn giản hoá infra cho MVP; tải chưa cần caching layer |
| 7 | **WebSocket / Socket.io** cho streaming | **HTTP SSE** (Server-Sent Events) | Đơn giản hơn WebSocket, phù hợp cho 1-directional streaming text |
| 8 | **Next.js + Tailwind + Shadcn** (Frontend) | **Next.js + Tailwind** (`apps/web`) — Shadcn chưa tích hợp | Frontend đang ở giai đoạn sớm |
| 9 | Hint levels: **L1/L2/L3** (3 cấp) | **L1/L2/L3/L4/L5** (5 cấp Cambridge pedagogy) | Mở rộng theo chuẩn IGCSE/A-Level: thêm Worked Example (L4) và Full Model Answer (L5) |
| 10 | Tên AI: **Javirs** | **LinhIQ** (Socratic mode) / **Linh** (Open Chat mode) | Rebrand theo PDD chính thức |
| 11 | Prompt chỉ có Socratic + Redirect | Thêm **OPEN_CHAT_SYSTEM_PROMPT** riêng biệt cho F3+F4 | Tách biệt persona "Thầy giáo" và "Bạn đồng hành" |

---

## Kiến Trúc Thực Tế (Actual Architecture)

```
LINHIQ — Codebase Structure (Turborepo)
══════════════════════════════════════════════════════════

javirs/                         ← Root (pnpm workspace + Turbo)
├── apps/
│   ├── api/                    ← NestJS Backend (port 4500)
│   │   └── src/
│   │       ├── common/         ← Guards (AuthGuard, RolesGuard)
│   │       ├── modules/
│   │       │   ├── admin/      ← Admin CRUD, provider switching
│   │       │   ├── ai/         ← AiService: multi-provider, streaming
│   │       │   ├── auth/       ← JWT auth (register/login)
│   │       │   ├── chat/       ← ChatController + ChatService
│   │       │   ├── database/   ← Prisma DatabaseService
│   │       │   ├── progress/   ← (placeholder)
│   │       │   └── rag/        ← RagService: vector + keyword search
│   │       └── main.ts
│   │
│   ├── web/                    ← Next.js Frontend
│   │   └── src/app/            ← App Router
│   │
│   └── data/curriculum/        ← Raw curriculum data (textbooks, PDFs)
│       └── igcse/biology/
│
├── packages/
│   ├── ai-config/              ← AI prompts & model routing
│   │   └── src/prompts/
│   │       ├── socratic.ts     ← SOCRATIC_SYSTEM_PROMPT + GENTLE_REDIRECT_PROMPT
│   │       ├── open-chat.ts    ← OPEN_CHAT_SYSTEM_PROMPT (F3+F4)
│   │       └── classifier.ts  ← CLASSIFIER_PROMPT + SAFE_CHAT_PROMPT
│   │
│   ├── database/               ← Prisma schema + migrations + seed
│   ├── types/                  ← Shared TypeScript types
│   └── validators/             ← Zod schemas
│
├── docs/
│   ├── product-design-document.md  ← PDD v1.0 (source of truth for features)
│   ├── ui-guideline.md             ← UI/UX Design System
│   └── ai_learning_platform/      ← Architecture & Tech stack docs (v1 — cũ)
│       ├── implementation_plan.md  ← [FILE NÀY] - Updated v2.0
│       ├── ai_learning_architecture.md
│       ├── ai_learning_tech_stack.md
│       └── ai_learning_platform_proposal.md
│
├── docker-compose.yml          ← PostgreSQL + pgvector
├── turbo.json                  ← Turborepo pipeline config
└── pnpm-workspace.yaml
```

---

## Prompt System — Trạng Thái Hiện Tại

### File: `packages/ai-config/src/prompts/`

| File | Export | Chức Năng | Status |
|---|---|---|---|
| `socratic.ts` | `SOCRATIC_SYSTEM_PROMPT` | Gia sư Socratic — dùng trong **SUBJECT mode** khi học sinh chọn môn học. Có RAG context, 5-level hint, citation, command word awareness. | ✅ Done |
| `socratic.ts` | `GENTLE_REDIRECT_PROMPT` | Redirect khi phát hiện nội dung HARMFUL/AGE_BOUNDARY — dùng trong **cả 2 mode** | ✅ Done |
| `open-chat.ts` | `OPEN_CHAT_SYSTEM_PROMPT` | Persona "Linh" — bạn đồng hành trong **OPEN mode** (F3). Tích hợp F4 Safe Chat playbook đầy đủ cho 7 categories. | ✅ Done |
| `classifier.ts` | `CLASSIFIER_PROMPT` | Classify query complexity: simple/complex/grading | ✅ Done |
| `classifier.ts` | `SAFE_CHAT_PROMPT` | Classify safe chat category: 8 categories (ACADEMIC → HARMFUL) | ✅ Done |

### Mismatch cần lưu ý: `OPEN_CHAT_SYSTEM_PROMPT` chưa được tích hợp vào backend

> [!WARNING]
> **`OPEN_CHAT_SYSTEM_PROMPT` đã được tạo và export từ `@javirs/ai-config` nhưng CHƯA được import/sử dụng trong `AiService` hoặc `ChatController`.**
> Hiện tại, khi session mode = `OPEN`, backend vẫn dùng `SOCRATIC_SYSTEM_PROMPT` hoặc `GENTLE_REDIRECT_PROMPT` thay vì `OPEN_CHAT_SYSTEM_PROMPT`.
> **TODO:** Cần thêm method `streamOpenChat()` trong `AiService` và routing logic trong `ChatController` để phân biệt SUBJECT vs OPEN mode.

---

## Database Schema — Trạng Thái Hiện Tại

### HintLevel Enum (đã mở rộng)
```prisma
enum HintLevel {
  L1 // Conceptual Nudge (Khơi gợi)
  L2 // Structural Scaffold (Gợi ý cấu trúc)
  L3 // Key Term Bridge (Thuật ngữ chìa khóa)
  L4 // Worked Example Parallel (Ví dụ tương tự)
  L5 // Full Model Answer (Đáp án mẫu)
}
```

> [!NOTE]
> PDD gốc (Mục F1) chỉ ghi L1/L2/L3. Code đã mở rộng thành 5 levels để bám sát Cambridge pedagogy. **PDD cần cập nhật mục F1** để đồng bộ.

### ChatMode Enum
```prisma
enum ChatMode {
  SUBJECT // Socratic + RAG (F1+F2)
  OPEN    // Open Chat (F3+F4)
}
```

### TopicCategory Enum (Safe Chat F4)
```
ACADEMIC | GENERAL | HOBBIES | LIFE | EMOTIONAL | MATURE_SOFT | AGE_BOUNDARY | HARMFUL
```

---

## API Modules — Trạng Thái Hiện Tại

| Module | Files | Status | Notes |
|---|---|---|---|
| `auth` | controller, service, module | ✅ Done | Custom JWT, bcrypt, register/login |
| `chat` | controller, service, module | ✅ Done (Partial) | SSE streaming, safe chat classify, topic stats. **Chưa route OPEN mode đến prompt riêng** |
| `ai` | service, module | ✅ Done (Partial) | Multi-provider (Gemini/OpenAI/Anthropic), streamChat, classifySafeChat, streamGentleRedirect. **Chưa có `streamOpenChat` method** |
| `rag` | service, module | ✅ Done | Vector search (pgvector) + keyword fallback, RAG context formatting with source attribution |
| `admin` | controller, service, module | ✅ Done | Provider switching, subject/curriculum CRUD |
| `database` | service, module | ✅ Done | Prisma client wrapper |
| `progress` | (placeholder) | ⬜ Not Started | F6 Progress Tracking |

---

## Lộ Trình Triển Khai (Updated Phases)

### Phase 1: Foundation ✅ DONE
- [x] Turborepo + pnpm workspace setup
- [x] NestJS API (`apps/api`)
- [x] Next.js Web (`apps/web`)
- [x] PostgreSQL + pgvector (Docker Compose)
- [x] Prisma schema v2.0 (User, Subject, Topic, Document, Chat, Progress)
- [x] Custom JWT Auth (register/login/guard)
- [x] Admin CRUD + AI Provider management

### Phase 2: RAG Pipeline & Socratic Engine ✅ DONE
- [x] RAG Service: vector search + keyword fallback
- [x] Embedding pipeline (`gemini-embedding-001`, 3072 dims)
- [x] Socratic Prompt v2 — LinhIQ branding, 5-level hints, Cambridge pedagogy
- [x] Query complexity classifier (simple/complex/grading)
- [x] Safe Chat classifier (8 categories)
- [x] SSE streaming chat endpoint
- [x] Topic stats tracking (SessionTopicStat)
- [x] Textbook data (IGCSE Biology) ingested to markdown

### Phase 3: Open Chat + Safety 🔄 IN PROGRESS
- [x] Open Chat prompt — `OPEN_CHAT_SYSTEM_PROMPT` (F3+F4)
- [x] Gentle Redirect prompt — updated for LinhIQ
- [x] HintLevel expanded to L1–L5
- [ ] **TODO: Integrate `OPEN_CHAT_SYSTEM_PROMPT` into `AiService.streamOpenChat()`**
- [ ] **TODO: Route OPEN mode sessions to `streamOpenChat()` in `ChatController`**
- [ ] **TODO: Update PDD F1 section to reflect 5-level hint system**
- [ ] Anonymous Topic Analytics flush (WeeklyTopicStat aggregation)

### Phase 4: Frontend UI 🔜 NEXT
- [ ] Chat UI redesign (dark mode, mobile-first)
- [ ] Hint level selector in chat input
- [ ] Study mode vs Open Chat mode toggle
- [ ] Dashboard: subject list, continue learning
- [ ] Progress visualization

### Phase 5: Advanced Features ⬜ FUTURE
- [ ] Photo Scanner (F5) — Vision AI integration
- [ ] Progress Tracking (F6) — mastery algorithm
- [ ] Parent Portal (F7) — dashboard, weekly reports
- [ ] Anonymous Analytics (F8) — wellness signals
- [ ] Onboarding flow (3-step)

---

## Open Questions (Updated)

1. ~~Chuẩn bị Dữ liệu~~ → **Đã giải quyết**: IGCSE Biology textbook đã parse sang Markdown, sẵn sàng ingest.
2. ~~LLM nào cho MVP~~ → **Đã giải quyết**: Gemini (gemini-2.5-flash/pro) là mặc định, hỗ trợ switching qua Admin.
3. ~~Database backend~~ → **Đã giải quyết**: PostgreSQL + Prisma + pgvector.
4. **MỚI**: Frontend cần redesign theo `ui-guideline.md` — ai phụ trách? Timeline?
5. **MỚI**: Khi nào tích hợp `OPEN_CHAT_SYSTEM_PROMPT` vào backend routing?

---

## Verification Plan (Updated)

### Automated Tests
- Script `test_chat.js` — test full flow: register → create session → send message → verify AI response
- Script `test_subj_chat.js` — test subject-specific Socratic mode
- Prisma schema validation via `prisma db push`

### Manual Verification
- Verify prompt behavior: AI không đưa đáp án thẳng (L1–L3), chỉ đưa khi L4/L5
- Verify safe chat: test với các message thuộc 8 categories
- Verify citation format: `📖 [Source — Chapter, p.XX]` xuất hiện khi RAG context available
- Verify language detection: AI phản hồi đúng ngôn ngữ học sinh sử dụng

---

## Docs Cần Cập Nhật Thêm

| File | Vấn đề | Ưu tiên |
|---|---|---|
| `product-design-document.md` (F1) | Ghi L1/L2/L3 → thực tế đã là L1–L5 | **P0** |
| `product-design-document.md` (F4) | Feature map ghi `(L1/L2/L3)` | **P0** |
| `ai_learning_architecture.md` | Vẫn ghi Python FastAPI, Socket.io, Redis — không còn đúng | P1 |
| `ai_learning_tech_stack.md` | Vẫn ghi OpenAI, LangChain, Clerk — đã thay đổi | P1 |
| `ai_learning_platform_proposal.md` | Vẫn ổn (vision document, không phải technical spec) | None |
