---
id: LIQ-208
title: Deep Solve mode (multi-agent plan → investigate → solve → verify)
phase: 2
priority: P1
estimate: 8d
status: Backlog
depends_on: []
blocks: []
tags: [backend, ai, chat]
---

# LIQ-208 — Deep Solve mode

## Problem

Hiện tại [ai.service.ts](../../../apps/api/src/modules/ai/ai.service.ts) chỉ chạy single-pass: prompt → 1 lần gọi Gemini → stream về user. Với câu hỏi khó (proof toán, bài Vật lý nhiều bước, phân tích văn) mô hình thường:
- Bỏ bước, kết quả sai vì không có self-check
- Trả lời "đoán mò" khi RAG không trả về chunk phù hợp
- Không thể giải thích "tại sao biết" cho học sinh

DeepTutor giải bằng pipeline 4-stage (`plan → investigate → solve → verify`); ý tưởng này phù hợp khi user click button "Deep Solve" trên 1 câu hỏi cụ thể (không bật mặc định vì chậm + tốn token).

## User story

> Là học sinh A-Level Physics đang vật lộn với bài cơ học, em bấm "🧠 Deep Solve" trên câu hỏi của mình. Linh hiện ra tiến trình "Đang lập kế hoạch... Đang tra textbook... Đang giải... Đang kiểm tra lại..." rồi đưa ra lời giải có cite trang sách + nêu rõ giả định.

## Acceptance criteria

- [ ] Endpoint `POST /chat/sessions/:id/deep-solve { messageId }` trả SSE
- [ ] 4 stage events stream về frontend: `plan`, `investigate`, `solve`, `verify`
- [ ] Mỗi stage có thể kéo dài 5–30s, tổng < 90s
- [ ] Stage `verify` chạy lại lời giải với prompt "tìm lỗi" — nếu phát hiện lỗi quay lại `solve` (max 1 retry)
- [ ] Final message lưu vào `ChatMessage` với `metadata.deepSolve = { plan, sources, verifyNotes }`
- [ ] Hint level bị bỏ qua trong Deep Solve (luôn giải đầy đủ, vì user đã chủ động yêu cầu)
- [ ] UI: button "🧠 Deep Solve" trên mỗi user message (chỉ khi `mode = SUBJECT`)
- [ ] UI: stepper component hiển thị 4 stage với spinner + tick khi xong
- [ ] Token usage được tính riêng và log vào `auditLog`
- [ ] Rate limit: max 5 deep-solve/user/giờ (chống abuse)

## Technical approach

### Pipeline architecture

```ts
// apps/api/src/modules/ai/deep-solve.service.ts
class DeepSolveService {
  async *run(question: string, ctx: ChatContext) {
    const plan = await this.plan(question, ctx);          // Gemini Flash
    yield { stage: "plan", data: plan };

    const evidence = await this.investigate(plan, ctx);   // RAG + multi-query
    yield { stage: "investigate", data: evidence };

    let solution = await this.solve(plan, evidence, ctx); // Gemini Pro
    yield { stage: "solve", data: solution };

    const verdict = await this.verify(solution, plan, evidence); // Gemini Pro
    yield { stage: "verify", data: verdict };

    if (!verdict.ok && !ctx.alreadyRetried) {
      solution = await this.solve(plan, evidence, ctx, verdict.issues);
      yield { stage: "solve", data: solution, retry: true };
    }

    return solution;
  }
}
```

### Model routing

Bổ sung [packages/ai-config/src/models.ts](../../../packages/ai-config/src/models.ts):

```ts
export const MODEL_ROUTES = {
  ...existing,
  deepSolvePlan: "gemini-2.5-flash",      // cheap, fast planning
  deepSolveSolve: "gemini-2.5-pro",       // heavy reasoning
  deepSolveVerify: "gemini-2.5-pro",      // heavy reasoning
};
```

### Prompts (mới trong `packages/ai-config/src/prompts/`)

- `deep-solve-plan.ts` — "List the steps required, identify what knowledge is needed."
- `deep-solve-verify.ts` — "Critique this solution. Look for: arithmetic errors, missing assumptions, unit mismatches, logic gaps."

### Investigate stage

Chạy multi-query RAG: từ plan rút ra 3–5 sub-question, parallel query [rag.service.ts](../../../apps/api/src/modules/rag/rag.service.ts), gộp + dedupe chunk. Lưu `ragSources` đầy đủ cho final message.

## Data model

Mở rộng `ChatMessage.metadata` (Json) — không cần migration mới:

```ts
metadata: {
  deepSolve?: {
    plan: string[];
    investigateQueries: string[];
    sources: { documentId, chunkId, pageNumber }[];
    verifyNotes: string;
    retried: boolean;
    durationMs: number;
    tokenBreakdown: { plan, investigate, solve, verify };
  }
}
```

## API design

```
POST /chat/sessions/:id/deep-solve
  body: { messageId: string }
  → SSE events:
    event: stage  data: { stage: "plan", content: "..." }
    event: stage  data: { stage: "investigate", content: "..." }
    event: stage  data: { stage: "solve", content: "..." }
    event: stage  data: { stage: "verify", content: "..." }
    event: done   data: { messageId, durationMs }
```

## UI notes

- Button "🧠 Deep Solve" chỉ xuất hiện trên user message cuối cùng (avoid clutter)
- Loading state là stepper dọc giống Linear/GitHub Actions
- Khi xong, message AI hiển thị bình thường + badge "🧠 Deep Solve" + collapsible "How I solved it"
- Mobile: stepper rút gọn thành progress bar

## Testing

- Unit: mock Gemini, test pipeline stage transitions + retry logic
- E2E: gửi câu hỏi proof toán, assert 4 stages stream về, final message có sources
- Cost regression: log token usage, alert nếu trung bình > 15k token/lần
- Failure: stage timeout (>30s) → fallback graceful, không crash session

## Out of scope

- Real-time collaborative deep-solve (nhiều user xem cùng) — Phase 3
- User can edit plan trước khi solve — Phase 3
- Apply Deep Solve cho mode OPEN — không cần thiết

## References

- DeepTutor "Deep Solve" mode (Apache-2.0): https://github.com/HKUDS/DeepTutor
- Tham khảo idea: ReAct, Reflexion patterns
