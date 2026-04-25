---
id: LIQ-101
title: OCR + Image tutoring (vision pipeline)
phase: 1
priority: P0
estimate: 5d
status: Backlog
depends_on: []
blocks: [LIQ-102]
tags: [backend, ai, frontend, vision]
---

# LIQ-101 — OCR + Image tutoring

## Problem

Học sinh IGCSE/A-Level/IB làm bài tay nhiều (Math, Physics, Chemistry diagrams, Bio labelling). Hiện LinhIQ chat chỉ nhận text. Đối thủ **MarkMe AI** và **Socratic by Google** đã support: chụp ảnh bài làm → AI đọc handwriting + chấm theo mark scheme + phản hồi Socratic.

Schema đã có sẵn `ChatMessage.imageUrl` ([schema.prisma:213](../../../packages/database/prisma/schema.prisma#L213)) nhưng **không có pipeline nào ghi vào field này** và không có upload endpoint. Cần wire full flow.

## User story

> Là học sinh IGCSE Chemistry, em muốn chụp ảnh phương trình em vừa giải trên giấy và nhờ Linh chỉ chỗ sai mà không cần gõ lại công thức.

## Acceptance criteria

- [ ] Chat input có nút Camera (đã có icon [chat/[id]/page.tsx:13](../../../apps/web/src/app/chat/[id]/page.tsx#L13)) — trigger file picker với `accept="image/*" capture="environment"`
- [ ] Upload lên Cloudflare R2 (keys đã có trong env), trả signed URL
- [ ] `ChatMessage.imageUrl` lưu URL; message render thumbnail trong bubble
- [ ] Backend: `ai.service.ts` khi `imageUrl` có giá trị → gọi Gemini 2.5 Pro với multimodal input `[{inlineData}, {text: socraticPrompt}]`
- [ ] Prompt template mới `socratic-vision.ts` trong `@linhiq/ai-config/src/prompts/` — hướng dẫn AI: (1) mô tả bài làm, (2) identify mistakes, (3) Socratic question theo hintLevel
- [ ] Image preview trước khi gửi (user có thể xoá)
- [ ] Max 5MB, auto-compress client-side với `browser-image-compression`
- [ ] Error handling: upload fail, vision API fail, image too dark/blurry (AI tự flag)
- [ ] Rate limit: 20 image/ngày cho FREE, unlimited cho PRO (dùng `SystemSetting.rateLimitFree`)

## Technical approach

### Backend

**New endpoint:** `POST /upload/chat-image`
- Multer middleware cho multipart upload
- Validate mime type (jpeg/png/webp), size <= 5MB
- Upload lên R2 qua `@aws-sdk/client-s3` (R2 compat)
- Return `{ url: string, expiresAt: Date }` (pre-signed 1h)

**Modify `chat.service.ts`:**
```ts
async sendMessage(sessionId, { content, imageUrl, hintLevel }) {
  // existing text-only path
  if (imageUrl) {
    const visionResponse = await this.aiService.streamVisionTutor({
      imageUrl, text: content, hintLevel, session
    });
    // save ChatMessage with imageUrl
  }
}
```

**`ai.service.ts`:** new method `streamVisionTutor` — dùng `@google/genai` với `generateContentStream` và part `inlineData`. Download image từ R2 → base64 → pass vào Gemini.

### Frontend

`apps/web/src/app/chat/[id]/page.tsx`:
- Add state `pendingImage: File | null`
- `handleImageSelect` → compress → preview → send cùng message
- Upload happens trong `handleSend` trước khi call `/chat/messages`

### Data model

Không cần migration mới. `imageUrl` field đã tồn tại.

## API design

```ts
POST /upload/chat-image
Content-Type: multipart/form-data
Body: { file: File, sessionId: string }
Response: { url: string, expiresAt: string }

POST /chat/sessions/:id/messages
Body: { content: string, imageUrl?: string, hintLevel: "L1"..."L5" }
Response: SSE stream (existing)
```

## UI notes

- Camera button to the LEFT of send button (not hidden in menu)
- Preview thumbnail: 80x80 rounded-lg, "x" to remove
- Loading shimmer during upload
- Desktop: drag-and-drop into chat surface (nice-to-have)

## Testing

- Unit: `ai.service.spec.ts` mock Gemini vision response
- E2E: upload happy path + rejected (too large, wrong mime)
- Manual: test on actual handwritten Chemistry equation, Bio cell diagram, Math working

## Out of scope

- Video upload (Phase 3)
- Real-time camera stream (Phase 3)
- PDF upload (use existing document ingestion flow)
- Handwriting → LaTeX conversion (future enhancement)

## References

- [MarkMe AI](https://markme.com/) — grading handwritten past papers
- [Gemini Vision API docs](https://ai.google.dev/gemini-api/docs/vision)
- [Cloudflare R2 S3 compat](https://developers.cloudflare.com/r2/api/s3/api/)
