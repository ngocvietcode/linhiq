# Implementation Plan: AI Learning Platform (Cambridge RAG)

Mục tiêu của tài liệu này là xây dựng một lộ trình bài bản (Implementation Plan) để khởi tạo dự án từ con số không (Zero to One), chia làm các giai đoạn (Phases) rõ rệt để có thể ra mắt một phiên bản MVP (Minimum Viable Product) khả thi trong khoảng thời gian ngắn nhất (khoảng 4-6 tuần).

## User Review Required

> [!CAUTION]
> **Quyết định Mô hình LLM cho MVP:** OpenAI (GPT-4o) dễ cài đặt và thông dụng, nhưng Anthropic (Claude 3.5 Sonnet) lại cho phản hồi sư phạm (tự nhiên, hướng dẫn cặn kẽ khơi gợi tư duy) xuất sắc hơn hẳn. Xin ý kiến nên ưu tiên API nào cho bản Demo?

> [!IMPORTANT]
> **Giới hạn phạm vi (Scope) của RAG Data:** Đối với phiên bản MVP, chúng ta chỉ nên chọn **duy nhất 1 môn học** (Ví dụ: IGCSE Biology hoặc IGCSE Math) để đưa tài liệu (PDF Sách + Đề thi) vào hệ thống tránh loãng dữ liệu. Bạn muốn triển khai môn nào đầu tiên?

> [!WARNING]
> **Quyết định Database Backend:** Chúng ta sẽ khởi tạo cấu trúc PostgreSQL ngay từ đầu, hay dùng Firebase cho MVP để tiết kiệm tối đa thời gian khởi tạo Auth & Database? (Khuyên dùng PostgreSQL + Supabase).

## Proposed Changes (Phân rã lộ trình triển khai)

---

### Phase 1: Foundation (Khởi tạo hệ thống cốt lõi - Tuần 1)
Thiết lập toàn bộ khung mã nguồn (Boilerplate) và hạ tầng phát triển.

#### [NEW] `apps/frontend/`
- Khởi tạo **Next.js 14+** (App Router).
- Cài đặt **Tailwind CSS** và **Shadcn UI** làm Design System chủ đạo.
- Thiết lập cấu trúc thư mục: `components`, `app/(routes)`, `lib`, `hooks`.

#### [NEW] `apps/ai-backend/`
- Khởi tạo **Python FastAPI**. Tách riêng AI ra một service siêu nhỏ.
- Môi trường (Environment): Cài đặt Poetry/Pipenv.
- Thêm thư viện AI: `llama-index`, `langchain`, `openai`, `anthropic`, `python-multipart`.

#### [NEW] Database & Infra
- Tạo Supabase project (hoặc local PostgreSQL docker container). Cài đặt extension `pgvector`.
- Set up **Clerk Auth** (nếu không dùng Supabase auth) hoặc Supabase Auth.

---

### Phase 2: RAG Pipeline & Data Ingestion (Tích hợp Cambridge - Tuần 2)
Xây dựng não bộ AI và tải dữ liệu giáo trình vào Vector DB.

#### [NEW] `apps/ai-backend/data_pipeline/`
- Viết Scripts OCR xử lý hàng loạt sách PDF: bóc tách chữ từng trang.
- Viết Scripts "Chunking": Cắt nhỏ tài liệu theo từng Context / Chapter.
- Thiết lập kịch bản kết nối Vector Database để lưu lại Embeddings.

#### [NEW] `apps/ai-backend/rag_engine/`
- Lập trình **Socratic Prompt** cực chuẩn.
- Lập trình tính năng Query (Truy xuất Vector DB khi học sinh đặt câu hỏi).

---

### Phase 3: Core API & WebSocket (Luồng giao tiếp thời gian thực - Tuần 3)
Phát triển logic tương tác giữa người dùng và AI.

#### [NEW] `apps/ai-backend/routers/chat.py`
- Xây dựng **WebSocket endpoint** hoặc HTTP SSE (Server-Sent Events) để stream dữ liệu từng chữ (typing effect) cho học sinh từ AI Engine.

#### [NEW] `apps/ai-backend/services/vision.py`
- Tích hợp hàm giải mã Hình ảnh (Vision): Cho phép upload ảnh bài toán, xử lý ảnh gửi sang GPT-4o-vision và đưa thành text qua RAG engine.

---

### Phase 4: Frontend UI (Giao diện học tập - Tuần 4)

#### [NEW] `apps/frontend/app/chat/page.tsx`
- Xây dựng giao diện Chatbot UI học đường (có bong bóng chat, phần upload hình ảnh).
- Tích hợp thư viện Markdown để render công thức Toán học `KaTeX/MathJax` và các đoạn code/đồ thị phản hồi từ AI.

#### [NEW] `apps/frontend/components/tutor/ProgressMap.tsx`
- Dashboard cho học sinh / phụ huynh tự đánh giá lỗ hổng thông qua biểu đồ tiến độ.

---

## Open Questions

1. **Chuẩn bị Dữ liệu (Data Prep)**: Bản thân các PDF Sách giáo khoa thường không có cấu trúc sạch. Team bạn đã có bộ Sách/Syllabus file chuẩn chưa hay cần có bước xử lý làm sạch dữ liệu thủ công?
2. **Khách hàng tiềm năng (User Flow)**: MVP này người trải nghiệm chính là Phụ huynh (để kiểm tra xem nó hoạt động thế nào) hay là Học sinh sẽ dùng thử ngay lập tức?

## Verification Plan

### Automated Tests
- Viết 1 test script trên Python nạp 50 MCQ (câu hỏi trắc nghiệm) từ Past Paper Cambridge gốc, bắt AI RAG trả lời và so khớp với đáp án đúng để tính tỷ lệ % chính xác (Accuracy rate).
- Test khả năng chịu tải nhẹ khi 10 học sinh gọi WebSocket cùng lúc.

### Manual Verification
- Bạn và đội ngũ sẽ trực tiếp upload 1 bức ảnh giải bài sinh học từ đề thực tế, xem AI mất bao nhiêu giây để (1) nhận diện chữ viết tay/đề thi -> (2) tìm kiếm nội dung Cambridge -> (3) trả lời gợi mở (Không đưa thẳng đáp án).
