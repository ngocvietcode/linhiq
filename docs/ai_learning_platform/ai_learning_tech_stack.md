# Lựa Chọn Công Nghệ (Tech Stack) Cho Hệ Thống AI Learning

Dưới đây là danh sách Tech Stack được lựa chọn chuyên biệt cho một hệ thống ứng dụng Giáo dục có tích hợp công nghệ AI/RAG tiên tiến. Sự lựa chọn này đảm bảo tính năng nội bật là **tốc độ phản hồi thấp (Low Latency)** cho AI chat, khả năng mở rộng tốt và xử lý dữ liệu vector hiệu quả.

---

## 1. Ứng Dụng Người Dùng (Frontend & Mobile)
*Cần giao diện mượt mà, nhiều tương tác và hiệu ứng thân thiện để giữ học sinh tập trung.*

- **Web Framework**: **Next.js (React)** với **Tailwind CSS**. Tối ưu hoá SEO tốt, hỗ trợ Server-Side Rendering (SSR) giúp tải trang cực nhanh.
- **Mobile App**: **React Native (Expo)**. Tận dụng nguồn lực React từ Web để làm App iOS/Android, tiết kiệm chi phí ban đầu mà vẫn cho trải nghiệm mượt mà.
- **Quản lý trạng thái (State Management)**: **Zustand** (nhẹ, code ngắn) hoặc Redux Toolkit.
- **Thư viện UI**: **Shadcn/ui** hoặc **Radix UI** để xây dựng các biểu đồ, component nhanh và tuỳ biến sắc nét theo Design System học đường.

---

## 2. Hệ Thống Máy Chủ & API (Backend Services)
*Backend sẽ chia làm 2 tầng rõ rệt: Tầng nghiệp vụ (Business) và Tầng xử lý AI.*

- **API Layer (Core System)**: **Node.js (NestJS)**. Nodejs mạnh mẽ khi xử lý hàng ngàn kết nối I/O cùng lúc (rất tốt cho Chatbot thời gian thực) và dễ đồng bộ mã nguồn với Frontend NextJS.
- **Socket / Giao tiếp Thời gian thực**: **Socket.io** hoặc **Server-Sent Events (SSE)**. Rất quan trọng khi streaming text (từng chữ một giống ChatGPT) để học sinh không phải chờ đợi.

---

## 3. Trí Tuệ Nhân Tạo & Xử Lý Cambridge (AI & RAG Stack)
*Trái tim của hệ thống, đòi hỏi sự tinh chỉnh kỹ càng nhất.*

- **Khung điều phối AI (AI Orchestration)**: **LlamaIndex** (rất xuất sắc cho RAG và tài liệu nặng như sách giáo khoa Cambridge) hoặc **LangChain**.
- **Mô hình Ngôn ngữ (LLMs)**: **Gemini 1.5 Pro / Flash** cho cả tác vụ phức tạp và đơn giản để tối ưu chi phí và tận dụng hệ sinh thái Google.
- **Mô hình nhúng (Embedding Models cho RAG)**: **Gemini text-embedding-004** (dùng để biến hàng ngàn trang sách Cambridge thành Vector).
- **Phân tích nhận diện chữ từ Ảnh (OCR & Vision)**: **Gemini 1.5 Pro / Flash Vision** (cho học sinh chụp bài toán viết tay).
- **Trợ lý âm thanh (Audio - Text-to-Speech)**: **OpenAI TTS** để phản hồi học sinh bằng giọng nói cực kỳ sống động và ấm áp.

---

## 4. Cơ Sở Dữ Liệu (Databases)

- **Cơ sở dữ liệu chính (Relational DB)**: **PostgreSQL**. Có tính toàn vẹn cao, lý tưởng để lưu trữ User, Học bạ, Lộ trình học (Knowledge Graph), Lịch sử thanh toán.
- **Cơ sở dữ liệu Vector (Vector DB cho RAG)**: 
  - Có thể tận dụng ngay **pgvector** (một plugin của PostgreSQL) để tiết kiệm và đồng bộ. 
  - Hoặc nếu dữ liệu sách Cambridge quá khổng lồ, dùng **Pinecone** hoặc **Qdrant** (hoạt động cực nhanh).
- **Bộ nhớ đệm (Caching & Session)**: Sử dụng trực tiếp **PostgreSQL / Memory** ở giai đoạn hiện tại (thay vì Redis) để giảm độ phức tạp vận hành.

---

## 5. Hạ Tầng & Quan Sát AI (DevOps & LLMOps)
*Quản lý không chỉ Server mà còn là theo dõi AI đang nói gì với học sinh.*

- **Cloud Provider**: Tạm thời triển khai trên **Vercel** (cho Frontend) và **Render/Railway/AWS EC2** (cho Backend API).
- **Bảo mật học đường**: **Custom Auth (JWT)** với token lưu trên DB để quản trị đăng nhập, phân quyền (Phụ huynh / Học sinh / Admin).
- **LLM Observability (Theo dõi AI & Chi phí)**: Đây là phần sống còn! Dùng **LangSmith** hoặc **Helicone**. Nó cho phép Admin vào xem nhật ký xem hôm nay: 
  - Học sinh A đã hỏi AI câu gì.
  - Các bước phân tích của AI (RAG truy xuất vào chương bài nào trong sách giáo khoa).
  - Theo dõi tiền API hàng ngày bị tiêu tốn.

---
## Đề xuất bước tiếp theo (Next Steps):
1. Liệu trong Tech Stack này có món công nghệ nào team bạn đang sử dụng và có thế mạnh sẵn không? 
2. Tiếp theo chúng ta có thể tiến hành **Vẽ Biểu đồ Kiến trúc Hệ thống (Architecture Diagram - C4 Model)** dựa trên Tech Stack này, bạn đồng ý chứ?
