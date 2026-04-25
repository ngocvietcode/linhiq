# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinhIQ is an AI-powered tutoring platform for secondary school students (IGCSE, A-Level, IB, AP, THPT Vietnamese curricula). It uses the Socratic method with configurable hint levels, RAG over textbook content, and content safety classification.

## Monorepo Structure

pnpm + Turborepo monorepo:

- `apps/api` — NestJS 11 backend (port 4500)
- `apps/web` — Next.js 16 frontend (port 3000)
- `apps/data` — Data ingestion scripts
- `packages/database` — Prisma client + document ingestion (`@linhiq/database`)
- `packages/types` — Shared TypeScript interfaces (`@linhiq/types`)
- `packages/validators` — Zod schemas for request validation (`@linhiq/validators`)
- `packages/ai-config` — LLM model routing and prompt templates (`@linhiq/ai-config`)

## Common Commands

```bash
# Development
pnpm dev                          # Run all apps via Turborepo
pnpm --filter api dev             # API only (nest start --watch)
pnpm --filter web dev             # Web only (next dev --webpack)

# Build
pnpm build                        # Build all
pnpm type-check                   # Type-check all packages

# Database
pnpm db:migrate                   # Run Prisma migrations (dev)
pnpm db:seed                      # Seed demo data (admin@linhiq.com / Admin@123)
pnpm db:studio                    # Open Prisma Studio
pnpm --filter @linhiq/database db:ingest  # AI document ingestion

# Testing (API only)
pnpm --filter api test            # Unit tests
pnpm --filter api test:watch      # Watch mode
pnpm --filter api test:e2e        # E2E tests (test/jest-e2e.json)
pnpm --filter api test:cov        # Coverage

# Linting
pnpm lint                         # Lint all
pnpm --filter api lint            # API: eslint with --fix
```

## Infrastructure (Docker)

```bash
docker-compose up -d   # Start PostgreSQL 16 (pgvector, port 5434), Redis 7 (6379), LiteLLM (4000)
```

## Architecture

### API (NestJS)

Modules live in `apps/api/src/modules/`. Each module owns its own controller, service, and DTOs. Key modules:

- **auth** — JWT access + refresh token flow, bcrypt passwords
- **chat** — SSE streaming, session management, hint level escalation
- **ai** — Socratic tutor, topic classifier, quiz grader (internal)
- **rag** — pgvector similarity search + keyword fallback over `DocumentChunk`
- **quiz** — Quiz generation and grading against topic content
- **subject** / **textbook** — Curriculum content, book volumes, page-topic mapping
- **progress** — Topic mastery tracking, study sessions
- **admin** — System settings, user management, audit logs, analytics

Global: `DatabaseService` (Prisma singleton) is provided in `database` module and imported globally.

### Web (Next.js App Router)

Routes under `apps/web/src/app/`. API calls go through `apps/web/src/lib/api.ts` — a fetch wrapper that handles JWT Bearer tokens, cookie-based refresh tokens, and automatic 401 retry.

**Important**: This project uses Next.js 16 (not 14/15). Breaking changes apply — see `apps/web/AGENTS.md`.

### Shared Packages

- **`@linhiq/ai-config/src/models.ts`** — Model routing: Gemini 2.5 Flash (simple), Gemini 2.5 Pro (complex/grading), Gemini Embedding 001 (vectors). RAG defaults: top-5, 0.65 similarity threshold, 800-char chunks / 150-char overlap.
- **`@linhiq/ai-config/src/prompts/`** — `socratic.ts` (hint levels L1–L5, bilingual EN/VI), `classifier.ts` (content safety categories), `open-chat.ts`, `quiz-generator.ts`
- **`@linhiq/validators`** — Zod schemas consumed by both API (validation pipes) and Web (form validation)

### AI Pipeline Flow

1. User message validated via `sendMessageSchema`
2. Classifier detects topic category and safety level
3. RAG fetches relevant `DocumentChunk` records (vector search with pgvector, keyword fallback)
4. Socratic prompt built with hint level context
5. Response streamed via SSE; tokens, model, and source references recorded on `ChatMessage`
6. `TopicProgress` and `StudySession` updated post-response

### Database Key Concepts

- `HintLevel` enum (L1–L5): controls how much guidance the AI gives
- `TopicCategory` enum: classifies messages for analytics and safety (academic/general/hobbies/life/emotional/mature/age-boundary/harmful)
- `ChatMode`: SUBJECT (curriculum-bound) vs OPEN (unrestricted)
- `DocumentChunk.embedding`: pgvector column for semantic search
- `BookPageTopic`: joins textbook pages to curriculum topics for contextual RAG

## Environment Variables

Copy `.env.example` to `.env`. Key groups:

- `DATABASE_URL`, `REDIS_URL` — PostgreSQL + Redis connection strings
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — Token signing
- `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` — LLM providers
- `LITELLM_URL`, `LITELLM_API_KEY` — LiteLLM gateway (default: http://localhost:4000/v1)
- `LANGFUSE_*` — Observability (optional)
- Cloudflare R2 keys — File storage for uploaded documents
