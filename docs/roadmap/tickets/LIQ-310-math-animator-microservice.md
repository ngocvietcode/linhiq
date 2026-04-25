---
id: LIQ-310
title: Math Animator microservice (Manim render)
phase: 3
priority: P2
estimate: 10d
status: Backlog
depends_on: [LIQ-205]
blocks: []
tags: [backend, ai, microservice, infra, content-render]
---

# LIQ-310 — Math Animator microservice

## Problem

LaTeX (LIQ-205) giải quyết công thức tĩnh, nhưng nhiều khái niệm STEM cần **animation** mới hiểu:
- Tích phân = diện tích dưới đường cong (animate Riemann sum)
- Sóng dao động, dao động điều hoà
- Phép biến đổi ma trận trong không gian 2D/3D
- Định lý Pytago → animate cắt ghép vuông

3Blue1Brown chứng minh sức mạnh của Manim. DeepTutor tích hợp ManimCat. Mình chạy Manim như microservice riêng (Python) gọi qua HTTP, không bóp NestJS.

Đây là Phase 3 vì: tốn infra (FFmpeg + Cairo), latency cao (5–60s/video), chỉ áp dụng được Math/Physics — phải build USP rõ trước khi đầu tư.

## User story

> Là học sinh đang học tích phân, em hỏi "tích phân là gì". Linh giải thích bằng text + render 1 animation 8 giây show diện tích dưới đường cong y=x² được lấp dần bằng các thanh chữ nhật mỏng đi. Em hiểu ngay.

## Acceptance criteria

- [ ] Microservice Python `apps/animator` chạy FastAPI + Manim CE
- [ ] Docker image với Cairo, Pango, FFmpeg, LaTeX
- [ ] Endpoint `POST /render { manimScript, sceneClass }` → trả `{ jobId }`
- [ ] Endpoint `GET /jobs/:id` → status, MP4 URL khi xong
- [ ] Worker queue: max 2 concurrent renders, timeout 60s
- [ ] AI tool: Linh có "tool" `generate_math_animation(concept, params)` — Gemini function-call
- [ ] Animation upload lên Cloudflare R2, URL trả về frontend
- [ ] Cache theo hash(script) — nếu identical script đã render, dùng lại MP4 cũ
- [ ] Frontend: render `<video>` inline trong chat message, autoplay muted loop
- [ ] Rate limit: 10 animations/user/ngày
- [ ] Cost guard: alert nếu tổng compute > X phút/ngày

## Technical approach

### Service layout

```
apps/animator/
  Dockerfile
  pyproject.toml
  app/
    main.py              # FastAPI
    renderer.py          # Manim invocation
    queue.py             # Redis-backed job queue
    storage.py           # R2 upload
    safety.py            # script sandbox / AST validate
```

### Safety — KEY concern

Manim script là Python code → **không bao giờ chạy raw user input**. Workflow:

1. Linh AI generate script qua function call với **structured params** (`function: "integral_area", expression: "x**2", interval: [0, 2]`)
2. Animator service có **library scenes có sẵn** (`IntegralAreaScene`, `WaveScene`, `MatrixTransformScene`, ...) — chỉ accept params
3. Không cho LLM tự viết Python code
4. AST validate: reject `import os`, `subprocess`, `__`, network calls

```python
# apps/animator/app/scenes/integral_area.py
class IntegralAreaScene(Scene):
    def __init__(self, expression: str, interval: tuple[float, float], steps: int = 20):
        self.expr = sympy.sympify(expression)  # validate via sympy parser
        self.interval = interval
        self.steps = steps
```

### Job queue

Redis (đã có ở docker-compose) với simple BLPOP worker. Không cần Celery để giữ deps mỏng.

### Integration với NestJS

```ts
// apps/api/src/modules/ai/tools/animator.tool.ts
async generateAnimation(params): Promise<AnimationResult> {
  const job = await fetch(`${env.ANIMATOR_URL}/render`, { method: "POST", ... });
  // Async — không block stream. Linh trả text trước, animation chèn vào message metadata khi xong
}
```

ChatMessage `metadata.animations: [{ url, posterUrl, durationSec, scene }]`.

### Render time budget

- Cold start: 30s (load Manim + LaTeX)
- Warm: 5–15s for 8s animation
- Solution: keep 1 worker warm 24/7, scale on queue depth

## Data model

```prisma
model Animation {
  id          String   @id @default(cuid())
  scriptHash  String   @unique
  scene       String
  params      Json
  status      String   // pending | rendering | done | failed
  videoUrl    String?
  posterUrl   String?
  durationMs  Int?
  errorMsg    String?
  createdById String?
  createdAt   DateTime @default(now())
  @@index([scriptHash])
}
```

## API design

```
POST /animator/render
  { scene: "IntegralAreaScene", params: { expression, interval, steps } }
  → { jobId, cached: false }

GET /animator/jobs/:id
  → { status, videoUrl?, posterUrl?, durationMs? }
```

NestJS proxy để giấu animator service khỏi internet trực tiếp + apply user auth/rate-limit.

## UI notes

- Inline `<video controls poster muted loop playsInline>` size đúng aspect ratio
- Skeleton placeholder (8s spinner) khi đang render
- "Replay" button + "Slow motion" toggle (HTML5 playbackRate)
- Mobile: tap-to-fullscreen, không autoplay (battery)

## Infra

- Cloudflare R2 bucket `linhiq-animations` với CDN
- Animator service deploy riêng (Docker + 2 vCPU + 2GB RAM đủ)
- Healthcheck endpoint cho NestJS detect outage → fallback sang text-only response

## Testing

- Unit Python: scene validation rejects malicious params
- Integration: render IntegralAreaScene → MP4 valid (ffprobe)
- Load: 10 concurrent jobs không OOM
- E2E: ask Linh "vẽ tích phân x^2" → message có video <video>

## Out of scope

- 3D animations (chậm + tốn RAM) — chỉ 2D Phase 3
- User-edit animation params trong UI — Phase 4
- Generate animation cho môn không-toán (Hoá phản ứng, Sinh học DNA) — Phase 4

## References

- Manim CE: https://docs.manim.community/
- DeepTutor Math Animator (ManimCat, Apache-2.0): https://github.com/HKUDS/DeepTutor
- 3Blue1Brown reference style
