---
id: LIQ-311
title: Deep Research mode (multi-source citation report)
phase: 3
priority: P2
estimate: 7d
status: Backlog
depends_on: [LIQ-208]
blocks: []
tags: [backend, ai, chat, research]
---

# LIQ-311 — Deep Research mode

## Problem

Học sinh khi viết EE (Extended Essay - IB), IA (Internal Assessment), bài coursework dài, hoặc tìm hiểu chủ đề "Climate change tác động lên Đông Nam Á" cần:
- Tổng hợp từ NHIỀU nguồn (textbook trong RAG + web)
- Citations chuẩn (MLA/APA/Harvard)
- Báo cáo có outline, có heading, có references

Chat hiện tại reply 1 đoạn 200–500 từ, không thể "research". User phải tự gộp thông tin.

DeepTutor có "Deep Research" mode — chạy parallel queries qua web + RAG, sinh report. Mình làm tương tự, focus vào use-case học thuật bậc THPT/đại học sớm.

## User story

> Là học sinh IB, em đang viết EE History về "Việt Nam Cộng hoà 1954–1963". Em bấm "🔬 Deep Research", nhập câu hỏi và scope. 2 phút sau Linh trả về báo cáo 1500 từ với 12 citations Harvard, có outline rõ, em copy-paste làm starting point cho EE.

## Acceptance criteria

- [ ] Endpoint `POST /research` → trả `{ jobId }`, render async
- [ ] User config: depth (shallow/standard/deep), citation style, max sources
- [ ] Pipeline: clarify → plan sub-questions → parallel search → synthesize → cite
- [ ] Sources: RAG (textbook đã ingest) + web search (Tavily/Brave API)
- [ ] Output: Markdown report với heading hierarchy, inline citations `[1]`, references list
- [ ] Sources include: title, author/site, URL, accessed date
- [ ] Job status page với progress (sub-question x/N done)
- [ ] Lưu report vào `ResearchReport` table — user xem lại history
- [ ] Export PDF/DOCX (Phase 3.5 — optional)
- [ ] Rate limit: 3 deep research/user/ngày, plan PRO unlimit
- [ ] Disclaimer: "AI có thể sai — verify nguồn trước khi nộp" hiển thị rõ

## Technical approach

### Pipeline

```ts
// apps/api/src/modules/research/research.service.ts
async run(query, opts) {
  const clarified = await ai.clarify(query);                   // 1 LLM call
  const plan = await ai.planSubQuestions(clarified, opts.depth); // 5–15 sub-q
  
  const evidence = await Promise.all(plan.map(async (q) => {
    const [ragHits, webHits] = await Promise.all([
      rag.search(q, { topK: 5 }),
      webSearch.query(q, { topK: 5, lang: opts.language }),
    ]);
    return { subQ: q, ragHits, webHits };
  }));
  
  const synthesis = await ai.synthesize(clarified, evidence, opts.citationStyle); // big LLM call
  return synthesis;
}
```

### Web search

Pluggable provider — start với 1:
- **Tavily** ($0.005/query, AI-friendly, summary inline) — tốt nhất cho học thuật
- Backup: Brave Search API ($3/1k queries)

Add `WEB_SEARCH_PROVIDER`, `WEB_SEARCH_API_KEY` env. Module `apps/api/src/modules/web-search/`.

### Citation engine

```ts
function formatCitation(source, style: "mla" | "apa" | "harvard"): string {
  // Use citation-js library (npm) — Harvard/MLA/APA built in
}
```

### Cost control

Estimate per report:
- Clarify: 0.5k tokens
- Plan: 1k tokens  
- Search: $0.05 web
- Synthesis: 30k tokens input + 4k output ≈ $0.10 (Gemini Pro)
- **Total: ~$0.15–0.30/report**

→ Free tier 1 report/tuần, PRO 3/ngày, premium unlimited.

## Data model

```prisma
model ResearchReport {
  id              String   @id @default(cuid())
  userId          String
  query           String   @db.Text
  depth           String   // shallow | standard | deep
  citationStyle   String   // mla | apa | harvard
  status          String   // pending | running | done | failed
  outline         Json?    // [{ heading, subQuestion, sourceIds[] }]
  reportMarkdown  String?  @db.Text
  references      Json?    // [{ id, type, title, author, url, accessedAt }]
  durationMs      Int?
  tokenUsage      Int?
  errorMsg        String?
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id])
  @@index([userId, createdAt])
}
```

## API design

```
POST /research
  { query, depth, citationStyle, language }
  → { jobId }

GET /research/:jobId        → status + partial outline
GET /research/:jobId/report → final markdown + references
GET /research               → list user's past reports (paginated)
DELETE /research/:jobId
```

SSE alternative: stream sub-question completions cho UX "đang nghiên cứu...".

## UI notes

- New page `/research` — list past reports + "New Research" button
- Modal: query (textarea), depth slider, citation dropdown, language
- Running view: stepper "Clarifying → Planning → Searching (3/12) → Writing"
- Report view: Markdown render (reuse LIQ-205 surface), sticky table-of-contents, "Copy" + "Export" buttons
- Source card: thumbnail (favicon for web, book cover for RAG), credibility badge

## Testing

- Unit: planSubQuestions returns valid array within depth bound
- Integration: mock Tavily, verify citations format correctly Harvard/MLA/APA
- E2E: query "photosynthesis" → report 800+ words, ≥5 sources, no broken citations
- Cost regression: average tokens/report < 50k

## Out of scope

- Auto-fact-check claim-by-claim — Phase 4 (research-grade hard problem)
- Image search & embed in report — Phase 4
- Collaborative editing — Phase 4
- Citation manager (Zotero export) — Phase 4

## References

- DeepTutor "Deep Research" mode (Apache-2.0): https://github.com/HKUDS/DeepTutor
- Tavily API: https://tavily.com/
- citation-js: https://citation.js.org/
