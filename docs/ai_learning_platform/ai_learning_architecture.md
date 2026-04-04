# Kiến Trúc Hệ Thống Nền Tảng Học Tập AI

Tài liệu này mô tả sơ đồ kiến trúc hệ thống dựa trên mô hình C4 (Context & Container) để trực quan hoá luồng dữ liệu của nền tảng ứng dụng RAG và giáo trình Cambridge.

---

## 1. Biểu Đồ Ngữ Cảnh Hệ Thống (System Context - L1)
*Biểu đồ này cho thấy hệ thống của chúng ta tương tác với ai (người dùng) và cái gì (hệ thống bên ngoài).*

```mermaid
C4Context
    title Biểu Đồ Ngữ Cảnh: Nền Tảng Học Tập AI (RAG Cambridge)

    %% Actors
    Person(student, "Học Sinh", "Học tập, hỏi đáp, làm bài tập và nhận đánh giá từ AI.")
    Person(parent, "Phụ Huynh", "Theo dõi tiến độ học tập, điểm số và bản đồ kiến thức của con.")
    Person(admin, "Giáo viên / Admin", "Quản lý nội dung, cập nhật giáo trình mới, giám sát chất lượng AI.")

    %% System under design
    System(aiPlatform, "AI Learning Platform", "Cốt lõi hệ thống: Cung cấp trợ lý học tập cá nhân qua chat, bài tập RAG, đánh giá tiến độ.")

    %% External Systems
    System_Ext(llmProvider, "LLM APIs", "Các tổ chức AI (OpenAI, Anthropic): Xử lý ngôn ngữ tự nhiên và Chat.")
    System_Ext(authProvider, "Auth Provider", "Bảo mật & Phân quyền đăng nhập (VD: Clerk/Firebase).")
    System_Ext(billingSystem, "Payment Gateway", "Xử lý nâng cấp gói cước học tập (Stripe).")

    %% Relationships
    Rel(student, aiPlatform, "Tương tác học tập đa nền tảng (Web/Mobile)")
    Rel(parent, aiPlatform, "Xem báo cáo học tập")
    Rel(admin, aiPlatform, "Quản trị nội dung và logs")
    
    Rel(aiPlatform, llmProvider, "Gửi Context RAG & Lấy Response")
    Rel(aiPlatform, authProvider, "Xác thực người dùng")
    Rel(aiPlatform, billingSystem, "Thanh toán gói cước")
```

---

## 2. Biểu Đồ Container (Container Diagram - L2)
*Biểu đồ này "bóc tách" Hệ thống (Platform) thành các khối chạy (containers) bao gồm Frontend, Backend, AI Engine và Database.*

```mermaid
C4Container
    title Biểu Đồ Container: Kiến trúc Kỹ thuật & Luồng dữ liệu RAG

    %% Users
    Person(student, "Học Sinh", "Sinh viên/Học sinh tương tác qua nền tảng")

    System_Boundary(c1, "AI Learning Platform") {
        %% Frontends
        Container(webApp, "Web Application", "Next.js, React", "Giao diện website tổng hợp cho học tập.")
        Container(mobileApp, "Mobile App", "React Native", "Ứng dụng điện thoại thông minh.")
        
        %% Backend APIs
        Container(apiGateway, "API Gateway / BFF", "Node.js/NestJS", "Xử lý Routing, điều hướng tải và API chung.")
        Container(chatService, "Realtime Chat Service", "Socket.io / Node.js", "Xử lý kết nối websocket trực tiếp để stream text.")
        Container(aiEngine, "AI RAG Engine", "Python / FastAPI", "Trái tim LLM: Điều phối LlamaIndex, xử lý RAG & Prompting.")
        
        %% Databases
        ContainerDb(rdbms, "Core Database", "PostgreSQL", "Lưu thông tin User, Progress, Học bạ.")
        ContainerDb(vectorDb, "RAG Vector DB", "pgvector / Pinecone", "Chứa vector nhúng của Sách giáo khoa, Past Papers.")
        ContainerDb(cacheCache, "Chat Cache", "Redis", "Lưu Session hội thoại ngắn hạn (Chat History) siêu nhanh.")
    }

    System_Ext(llmAPI, "OpenAI / Anthropic API", "LLM Inference Endpoint")
    System_Ext(llmObs, "LangSmith / Helicone", "Giám sát Logs AI")

    %% Relations Users -> UI -> Gateway
    Rel(student, webApp, "Sử dụng nền tảng (HTTPS)")
    Rel(student, mobileApp, "Sử dụng nền tảng (HTTPS/WSS)")
    Rel(webApp, apiGateway, "Gọi API chức năng")
    Rel(mobileApp, apiGateway, "Gọi API chức năng")
    Rel(webApp, chatService, "Kết nối Stream hội thoại (WSS)")
    Rel(mobileApp, chatService, "Kết nối Stream hội thoại (WSS)")

    %% Internal Backend logic
    Rel(apiGateway, chatService, "Xác thực Session")
    Rel(apiGateway, rdbms, "Đọc/Ghi dữ liệu (SQL)")
    Rel(chatService, cacheCache, "Lưu/Đọc Lịch sử Chat")
    
    %% The RAG Flow
    Rel(chatService, aiEngine, "Chuyển câu hỏi của học sinh (gRPC/HTTP)")
    Rel(aiEngine, vectorDb, "Search Query (Vector Similarity)")
    Rel(aiEngine, llmAPI, "Sinh câu trả lời có chứa Context sách Cambridge")
    Rel(aiEngine, llmObs, "Báo cáo Logs, Tokens")
    Rel(aiEngine, rdbms, "Lưu điểm số, Graph tiến độ học")
```

---

## 3. Luồng Xử Lý Điển Hình (Ví dụ Truy vấn RAG)
1. **Học sinh** mở cửa sổ học tập trên **Web/Mobile** và hỏi "What is covalent bond?".
2. Yêu cầu chạy qua WebSockets kết nối vào **Chat Service** (Node.js).
3. Chat Service lấy lịch sử nhắn tin từ **Redis Cache** và đẩy yêu cầu sang **AI Engine** (FastAPI).
4. **AI Engine** biến câu hỏi thành Vector và lấy thông tin Covalent Bond chính xác từ **Vector DB** (Sách IGCSE Chemistry Cambridge).
5. **AI Engine** kết hợp tài liệu này làm Context (ngữ cảnh) cùng với hướng dẫn Socratic để gọi tới **LLM API**.
6. LLM bắt đầu trả lời từng chữ (streaming) ngược về **AI Engine => Chat Service => Web/Mobile**. Đồng thời **AI Engine** ghi lại log lên hệ thống đánh giá **LangSmith**.
7. Lịch sử tiến độ của học sinh được lưu về **PostgreSQL**.
