# 📘 LinhIQ — Product Design Document (PDD)
**Version:** 1.0
**Date:** April 2026
**Status:** Living Document — Updated as features evolve
**Language:** Bilingual (VI/EN)

---

## MỤC LỤC

1. [Tầm nhìn & Sứ mệnh](#1-tầm-nhìn--sứ-mệnh)
2. [Đối tượng người dùng](#2-đối-tượng-người-dùng)
3. [Mục tiêu sản phẩm](#3-mục-tiêu-sản-phẩm)
4. [Kiến trúc tính năng](#4-kiến-trúc-tính-năng)
5. [Đặc tả tính năng chi tiết](#5-đặc-tả-tính-năng-chi-tiết)
   - [F1: Socratic Tutor Engine](#f1-socratic-tutor-engine)
   - [F2: RAG Knowledge Base (Multi-Curriculum)](#f2-rag-knowledge-base-multi-curriculum)
   - [F3: Open Chat với AI Tutor](#f3-open-chat-với-ai-tutor)
   - [F4: Safe Chat — Bộ lọc & Điều hướng](#f4-safe-chat--bộ-lọc--điều-hướng)
   - [F5: Photo Scanner](#f5-photo-scanner)
   - [F6: Progress Tracking](#f6-progress-tracking)
   - [F7: Parent Portal](#f7-parent-portal)
   - [F8: Anonymous Topic Analytics](#f8-anonymous-topic-analytics)
6. [Chính sách Quyền riêng tư Học sinh](#6-chính-sách-quyền-riêng-tư-học-sinh)
7. [Không gian được phép & Không được phép](#7-không-gian-được-phép--không-được-phép)
8. [Luồng người dùng chính](#8-luồng-người-dùng-chính)
9. [Tiêu chí thành công (OKRs)](#9-tiêu-chí-thành-công-okrs)
10. [Lộ trình phát triển](#10-lộ-trình-phát-triển)

---

## 1. Tầm nhìn & Sứ mệnh

### Tầm nhìn (Vision)

> **"Mọi học sinh đều xứng đáng có một gia sư xuất sắc — bất kể điều kiện kinh tế hay chương trình học."**

LinhIQ hướng đến trở thành người bạn đồng hành học tập đáng tin cậy nhất cho học sinh phổ thông trên toàn thế giới, đặc biệt tại Việt Nam và Đông Nam Á — hỗ trợ đa chương trình từ Cambridge IGCSE/A-Level đến chương trình THPT Việt Nam, nơi chi phí gia sư cá nhân vượt khả năng của đa số gia đình.

### Sứ mệnh (Mission)

Cung cấp trải nghiệm học tập được cá nhân hoá chất lượng cao, nơi AI không thay thế việc học — mà **dạy học sinh cách tư duy độc lập** thông qua phương pháp Socratic, nền tảng tri thức đa chương trình chuẩn xác (Cambridge, THPT VN và các hệ khác), và một môi trường an toàn, hỗ trợ cảm xúc lành mạnh.

### Ý nghĩa tên thương hiệu

| Thành phần | Ý nghĩa |
|---|---|
| **Linh** (灵) | Linh hoạt, tinh anh, thông tuệ — AI thích nghi theo từng học sinh |
| **Linh** (tên Việt) | Thân thiện, gần gũi — "Em hỏi Linh xem" |
| **IQ** | Trí tuệ, năng lực học tập — mục tiêu nâng cao năng lực |
| **LinhIQ** | Người bạn thông minh giúp em thông minh hơn |

### Giá trị cốt lõi (Core Values)

| Giá trị | Biểu hiện trong sản phẩm |
|---|---|
| **Dạy tư duy, không cho đáp án** | Mọi câu trả lời AI đều kết thúc bằng một câu hỏi gợi mở |
| **Tin tưởng học sinh** | Không theo dõi, không báo cáo cá nhân — học sinh có không gian an toàn |
| **Tôn trọng độ tuổi** | Điều hướng nhẹ nhàng, không phán xét, không cảnh cáo đột ngột |
| **Minh bạch với phụ huynh** | Phụ huynh nhận thống kê tổng hợp, không có dữ liệu cá nhân |
| **Chuẩn xác học thuật** | Mọi nội dung đều được căn cứ vào tài liệu chương trình học chính thống (Cambridge, THPT VN, v.v.) |

---

## 2. Đối tượng người dùng

### 2.1 Học sinh (Primary User)

**Hồ sơ điển hình:**

```
Minh Nguyen — 15 tuổi, TP.HCM
- Học IGCSE Year 10 tại trường quốc tế
- Giỏi Biology nhưng yếu Mathematics
- Thường học vào 9–11pm sau khi ăn tối
- Dùng điện thoại là chủ yếu, đôi khi laptop
- Áp lực thi cử cao từ gia đình
- Muốn có ai đó để hỏi mà không bị phán xét
- Thỉnh thoảng muốn hỏi những thứ ngoài học tập
```

**Nhu cầu:**
- Hiểu bài, không phải chép đáp án
- Có thể hỏi bất cứ lúc nào, kể cả 12 giờ đêm
- Không bị "báo cáo" với phụ huynh về từng câu hỏi
- Được giải thích theo cách phù hợp với mình

**Nỗi sợ:**
- AI cứng nhắc, không hiểu ngữ cảnh
- Cảm thấy bị giám sát hoặc phán xét
- Giao diện quá trẻ con hoặc quá phức tạp

---

### 2.2 Phụ huynh (Secondary User)

**Hồ sơ điển hình:**

```
Mr. Hung — 45 tuổi, kỹ sư
- Con học IGCSE, thi A-Level trong 2 năm nữa
- Bản thân không học hệ Cambridge, không hỗ trợ được con
- Muốn biết con có học nghiêm túc không
- Lo lắng về nội dung AI nói với con
- Sẵn sàng trả tiền nếu thấy hiệu quả thực sự
```

**Nhu cầu:**
- Thấy được con học bao nhiêu giờ, môn nào
- Biết con đang giỏi/yếu phần nào để hỗ trợ
- Tin tưởng nội dung AI là an toàn và phù hợp
- Báo cáo dễ hiểu, không cần hiểu kỹ thuật

**Nỗi sợ:**
- AI "làm hộ bài" thay vì dạy con tư duy
- Nội dung không phù hợp tuổi xuất hiện trong chat
- Lãng phí tiền vào thứ con không dùng

---

### 2.3 Admin (Internal User)

- Quản lý nội dung RAG, cập nhật giáo trình
- Điều chỉnh AI provider và cấu hình hệ thống
- Xem dashboard thống kê platform (không xem chat cá nhân)
- Xử lý các báo cáo nội dung bất thường (automated flagging)

---

## 3. Mục tiêu sản phẩm

### 3.1 Mục tiêu học tập

| # | Mục tiêu | Cách đo lường |
|---|---|---|
| L1 | Học sinh hiểu bài sâu hơn, không chỉ nhớ đáp án | Điểm quiz tăng qua các phiên, mastery level tăng |
| L2 | Recap đúng KEY TERMS theo đáp án chuẩn của từng chương trình | Tỷ lệ key terms được sử dụng đúng trong câu trả lời |
| L3 | Học sinh chủ động hỏi, không bị thụ động | Số câu hỏi follow-up / session tăng |
| L4 | Phát hiện điểm yếu sớm trước kỳ thi | % topics có mastery < 50% giảm trong 30 ngày |

### 3.2 Mục tiêu sản phẩm

| # | Mục tiêu | KPI |
|---|---|---|
| P1 | Retention học sinh | 30-day retention > 40% |
| P2 | Tần suất sử dụng | Avg. 4+ sessions/week per active student |
| P3 | NPS phụ huynh | NPS > 35 sau 60 ngày dùng |
| P4 | Chuyển đổi Free → Pro | Conversion rate > 8% trong 14 ngày |
| P5 | Độ an toàn nội dung | < 0.1% messages vượt giới hạn an toàn |

### 3.3 Mục tiêu kinh doanh

| Giai đoạn | Mục tiêu |
|---|---|
| Month 3 | 100 active students (beta) |
| Month 6 | 500 paying students, NPS > 30 |
| Month 12 | 2,000 paying students, 2 school partnerships |
| Month 18 | Break-even, expand to 2nd curriculum |

---

## 4. Kiến trúc tính năng

```
LINHIQ — Feature Map
══════════════════════════════════════════════════════════

🎓 STUDENT ZONE (Dark mode, mobile-first)
├── F1 · Socratic Tutor Engine         [P0 — MVP Core]
│     ├── Query classification (simple/complex/grading)
│     ├── RAG-grounded responses
│     ├── Hint level system (L1–L5, Cambridge pedagogy)
│     ├── KEY TERM detection & highlighting
│     └── Streaming SSE responses
│
├── F2 · RAG Knowledge Base            [P0 — MVP Core]
│     ├── Multi-curriculum support (Cambridge, THPT VN, ...)
│     ├── Vector search (pgvector)
│     ├── Keyword fallback search
│     ├── Multi-subject support
│     └── Data ingestion pipeline (PDF/OCR)
│
├── F3 · Open Chat với AI Tutor        [P1 — NEW FEATURE]
│     ├── Không giới hạn chủ đề (học thuật + cuộc sống)
│     ├── Safe Chat filter (F4) tích hợp
│     ├── Gentle redirect khi cần
│     └── Persona: người bạn thông minh, không phán xét
│
├── F4 · Safe Chat Filter & Redirect   [P0 — Core Safety]
│     ├── Age-appropriate content detection
│     ├── Gentle, proactive language
│     ├── Never harsh warnings
│     ├── Topic classification (silent, no logging per user)
│     └── Aggregate analytics only
│
├── F5 · Photo Scanner                 [P1 — MVP+]
│     ├── Photo upload (homework, textbook)
│     ├── OCR + Vision AI analysis
│     └── Feeds into Socratic Engine
│
├── F6 · Progress Tracking             [P1 — MVP+]
│     ├── Topic mastery visualization
│     ├── Study time tracking
│     ├── Key terms earned
│     ├── Streak system
│     └── Weak area detection
│
└── Onboarding (3 steps)               [P0 — MVP]

👨‍👩‍👧 PARENT ZONE (Light mode, desktop-first)
├── F7 · Parent Dashboard              [P1 — MVP+]
│     ├── Weekly study summary
│     ├── Subject progress overview
│     ├── Attention alerts (không học x ngày)
│     └── Activity log (topic level, NOT message level)
│
└── F8 · Anonymous Topic Analytics     [P1 — NEW FEATURE]
      ├── Aggregate topic distribution (%)
      ├── No individual message tracking
      ├── Wellness indicators (% off-topic, % redirected)
      └── Weekly/monthly PDF report

⚙️ ADMIN ZONE
├── AI Provider Management (Gemini/OpenAI/Anthropic)
├── Subject & Curriculum Management
├── Platform-wide Analytics
└── Content Safety Dashboard (aggregate only)

══════════════════════════════════════════════════════════
```

---

## 5. Đặc tả tính năng chi tiết

---

### F1: Socratic Tutor Engine

**Mô tả:** Hệ thống AI cốt lõi, dạy học sinh thông qua câu hỏi gợi mở thay vì đưa đáp án trực tiếp.

**Hành vi AI:**
- Luôn bắt đầu bằng câu hỏi khám phá kiến thức hiện có của học sinh
- Xác nhận những phần học sinh đúng trước khi sửa sai
- Đánh dấu KEY TERMS của chương trình tương ứng khi học sinh dùng đúng (earn mechanism)
- Kết thúc mỗi turn bằng một câu hỏi dẫn tiếp

**Hint Levels (Cambridge IGCSE/A-Level Aligned):**
| Level | Tên | Tên Việt | Hành vi |
|---|---|---|---|
| L1 | Conceptual Nudge | Khơi gợi | Hỏi học sinh đã biết gì, gợi hướng khái niệm, kết nối kiến thức cũ |
| L2 | Structural Scaffold | Gợi ý cấu trúc | Chỉ ra cấu trúc đáp án (bao nhiêu phần, command word), cho framework để điền |
| L3 | Key Term Bridge | Thuật ngữ chìa khóa | Cung cấp key terms từ Mark Scheme, chỉ ra thuật ngữ nào còn thiếu |
| L4 | Worked Example | Ví dụ tương tự | Đưa worked example của câu hỏi tương tự, học sinh tự pattern-match |
| L5 | Full Model Answer | Đáp án mẫu | Đáp án đầy đủ theo chuẩn Mark Scheme, chỉ sau khi học sinh đã thử ≥2 lần |

**Command Word Awareness (Cambridge Standard):**
| Command Word | Kỳ vọng của giám khảo |
|---|---|
| State/Name | 1–2 từ, sự kiện đơn giản |
| Define | Định nghĩa chính xác theo syllabus |
| Describe | Mô tả từng bước (what happens) |
| Explain | Describe + reason ("because" / "this means that") |
| Compare | Similarities AND differences, side by side |
| Evaluate/Discuss | Luận điểm for AND against, kết luận |

**Textbook Citation (bắt buộc):**
- AI trích dẫn nguồn từ RAG context kèm format: 📖 *[Source Title — Chapter, p.XX]*
- Không bao giờ bịa trích dẫn — chỉ cite nguồn có trong hệ thống

**Query Classification (tự động, silent):**
- `simple` → Câu hỏi định nghĩa, sự kiện đơn giản → dùng model nhỏ
- `complex` → Yêu cầu lập luận nhiều bước, so sánh → dùng model mạnh
- `grading` → Học sinh submit câu trả lời để chấm → dùng model chấm điểm

**Auto-Adjustment Rules:**
- Học sinh nói "I don't know" / "không biết" → tự hạ về Level 1 + khuyến khích thêm
- Học sinh nói "just tell me" / "cho đáp án đi" → chuyển Level 4 (worked example), KHÔNG phải Level 5
- Level 5 chỉ khi học sinh đã cố gắng ≥2 lần

**Acceptance Criteria:**
- AI không bao giờ đưa đáp án thẳng ở L1–L4
- AI tự động detect ngôn ngữ học sinh (Anh/Việt/song ngữ) và phản hồi tương ứng
- Mọi factual claim phải kèm textbook citation từ RAG context
- KEY TERM highlight hiển thị inline trong bubble AI: ✅ **KEY TERM**: [term]
- Response streaming: word-by-word via SSE, < 200ms first token

---

### F2: RAG Knowledge Base (Multi-Curriculum)

**Mô tả:** Cơ sở dữ liệu vector embedding từ tài liệu chính thống của các chương trình học — đảm bảo AI không hallucinate và luôn bám sát nội dung giáo trình thực tế của học sinh.

**Chương trình hỗ trợ:**
| Curriculum | Phạm vi | Ưu tiên MVP |
|---|---|---|
| Cambridge IGCSE | Grade 9–10, Biology/Chemistry/Math/Physics | P0 |
| Cambridge A-Level | Grade 11–12, các môn tương ứng | P1 |
| THPT Việt Nam | Lớp 10–12, Toán/Lý/Hóa/Sinh | P1 |
| Chương trình khác | IB, AP (tương lai) | P2 |

**Nguồn dữ liệu (per curriculum):**
| Loại | Nội dung | Ưu tiên |
|---|---|---|
| Textbook chapters | Nội dung lý thuyết từng chương | P0 |
| Answer schemes | Đáp án chuẩn và KEY TERMS | P0 |
| Past papers / Đề thi | Câu hỏi các năm trước | P1 |
| Syllabus / Khung chương trình | Mục tiêu học tập, phân phối chương trình | P1 |

**Technical:**
- Embeddings: `gemini-embedding-001` (3072 dimensions)
- Vector DB: PostgreSQL + pgvector
- Search: cosine similarity, threshold ≥ 0.65
- Fallback: keyword search (ILIKE) khi không có embedding
- Chunk size: 800 tokens, overlap 150 tokens

**Context injection vào prompt:**
```
Nếu RAG tìm được context phù hợp:
  → Inject trực tiếp vào system prompt
  → AI ưu tiên context này, không dùng general knowledge

Nếu không tìm được (similarity < 0.65):
  → AI nói: "This isn't in my current materials, let me help
    with what I know — but verify with your textbook."
```

---

### F3: Open Chat với AI Tutor

**Mô tả:** Học sinh có thể trò chuyện tự do với AI Tutor về bất kỳ chủ đề nào — học tập, cuộc sống, sở thích — không bị giới hạn chỉ trong môn học. AI hoạt động như một người bạn thông minh, hỗ trợ cả về mặt tinh thần, không chỉ về học thuật.

**Persona của AI trong Open Chat:**

> LinhIQ không chỉ là gia sư học thuật — mà là người bạn đồng hành thông minh. Linh lắng nghe, hỏi thêm, và luôn khuyến khích học sinh suy nghĩ và tự tìm câu trả lời cho mình.

**Phân loại chủ đề cho phép:**

| Nhóm chủ đề | Ví dụ | Cách xử lý |
|---|---|---|
| **Học thuật** | Bài tập, khái niệm, ôn thi | Socratic mode đầy đủ + RAG |
| **Khoa học phổ thông** | Tại sao bầu trời xanh? AI là gì? | Giải thích tự nhiên, không cần RAG |
| **Sở thích & cuộc sống** | Âm nhạc, phim, thể thao, gaming | Giao tiếp tự nhiên, nhẹ nhàng |
| **Học cách học** | Cách ghi chú, quản lý thời gian | Tư vấn học tập thiết thực |
| **Cảm xúc nhẹ** | Căng thẳng về thi cử, lo âu học thuật | Lắng nghe, xác nhận cảm xúc, redirect nhẹ |

**Chế độ học thuật vs. Open Chat:**
```
Student chọn subject → Socratic mode (có RAG context)
Student chọn "Chat với Linh / Free Talk" → Open Chat mode (F3 + F4)
```

**Persona — Linh (Open Chat mode):**

> Linh là "cool older sibling" — casual nhưng không slang, ấm áp nhưng không trẻ con. Linh tò mò, không phán xét, playful, và thành thật.

**Conversation Style:**
- 2–4 câu mỗi message, rồi hỏi hoặc mời tiếp tục
- Match energy: học sinh hào hứng → hào hứng cùng, học sinh mệt → nhẹ nhàng
- Emoji tự nhiên nhưng không quá: 😄 😊 💡 🎮 🎵 (2–3 max)
- Tự động detect ngôn ngữ (Anh/Việt/song ngữ)
- Không bao giờ nói "I'm just an AI" hay "As an AI language model..."

**Core Personality Traits:**
1. **Curious** — Genuinely find their interests fascinating
2. **Non-judgmental** — NEVER lecture, moralize, or say "you should"
3. **Warm** — Care about feelings, listen first
4. **Smart** — Share knowledge naturally, don't show off
5. **Playful** — Fun and lighthearted when the mood is right
6. **Honest** — Admit when not sure

**Learning Bridge (kết nối về study mode):**
- Khi chủ đề liên quan đến bài học → gợi ý nhẹ nhàng: "Ơ hay, cái đó liên quan đến bài Biology đấy — muốn mình giải thích kiểu học bài không?"
- NEVER push. Nếu họ từ chối → respect và ở lại chat mode.

**Prompt implementation:** Xem chi tiết tại `packages/ai-config/src/prompts/open-chat.ts` — `OPEN_CHAT_SYSTEM_PROMPT`

---

### F4: Safe Chat — Bộ lọc & Điều hướng

**Mô tả:** Hệ thống phân loại và xử lý nội dung nhạy cảm tuổi vị thành niên. **Không phải cảnh sát nội dung** — mà là người bạn khéo léo điều hướng cuộc trò chuyện.

#### 4.1 Nguyên tắc cốt lõi

```
✅ Điều hướng chủ động, nhẹ nhàng
✅ Ngôn ngữ ấm áp, không phán xét
✅ Không bao giờ từ chối thô lỗ
✅ Không bao giờ nói "Tôi không thể trả lời câu hỏi này"
✅ Không log, không báo cáo cá nhân
✅ Chỉ thu thập thống kê tổng hợp (aggregate)

❌ Không cảnh báo mạnh ("This content is inappropriate!")
❌ Không dùng ngôn ngữ kiểm duyệt
❌ Không kết thúc cuộc trò chuyện đột ngột
❌ Không báo cáo lên admin hay phụ huynh theo tên
```

#### 4.2 Phân loại nội dung (Silent Classification)

Mỗi message được phân loại ngầm (student KHÔNG nhìn thấy label):

| Category | Label | Hành động AI |
|---|---|---|
| Academic | `academic` | Socratic + RAG response |
| General knowledge | `general` | Friendly explanation |
| Hobbies & lifestyle | `hobbies` | Engage naturally |
| Emotional support | `emotional` | Validate + gentle redirect |
| Mature-adjacent | `mature_soft` | Redirect to general concept |
| Age-boundary | `age_boundary` | Gentle redirect (xem 4.3) |
| Harmful/Dangerous | `harmful` | Safe response + resource |

#### 4.3 Playbook điều hướng theo từng category

**`mature_soft` — Ví dụ: hỏi về tình yêu, dating, rượu bia (không có hại)**

```
Học sinh hỏi: "Em đang thích một bạn trong lớp. Em nên làm gì?"

AI KHÔNG làm:
  ❌ "Câu hỏi này không phù hợp với tôi."
  ❌ "Bạn nên hỏi cha mẹ về điều này."
  ❌ Ngắt cuộc trò chuyện

AI LÀM:
  ✅ "Cảm xúc đó hoàn toàn bình thường khi bạn đang ở độ tuổi
     của mình — nó thực sự khiến mọi thứ trở nên phức tạp hơn
     một chút, đúng không? 😄 Điều bạn đang cảm thấy là gì
     nhất — hồi hộp, lo lắng, hay vừa cả hai?"
  → Engage, validate, không đi vào chi tiết không phù hợp
```

**`age_boundary` — Ví dụ: nội dung bạo lực, 18+, nguy hiểm**

```
Học sinh hỏi: "Kể cho em nghe về [nội dung vượt tuổi]"

AI KHÔNG làm:
  ❌ "Tôi không thể và sẽ không cung cấp thông tin đó."
  ❌ Warning banner đỏ
  ❌ Log và báo cáo

AI LÀM:
  ✅ Phản hồi nhẹ nhàng, chuyển hướng sang chủ đề liên quan
     nhưng phù hợp:
     "Chủ đề đó khá phức tạp và cần nhiều ngữ cảnh để hiểu
     đúng. Mình có thể chia sẻ góc nhìn [liên quan nhưng phù hợp]
     thay thế được không? Hoặc bạn đang tò mò về khía cạnh nào
     cụ thể nhất?"
  → Giữ kết nối, redirect sang góc độ phù hợp
```

**`harmful` — Ví dụ: hỏi về tự làm hại, substance use**

```
AI LÀM:
  ✅ Validate cảm xúc trước
  ✅ Cung cấp thông tin đường dây hỗ trợ phù hợp tuổi tại địa phương
  ✅ Không lecture hay moralize
  ✅ Khuyến khích nói chuyện với người lớn tin tưởng

  "Mình nghe bạn, và mình muốn bạn biết rằng những cảm xúc như
  vậy rất nặng nề khi phải mang một mình. Có một số nơi bạn có
  thể nói chuyện với ai đó được đào tạo để lắng nghe — ở Việt Nam
  có đường dây [1800-599-920]. Bây giờ, bạn có muốn kể cho mình
  nghe bạn đang cảm thấy thế nào không?"
```

**`emotional` — Ví dụ: áp lực thi cử, buồn bã, mệt mỏi**

```
Học sinh: "Em chán học lắm, chẳng biết học để làm gì nữa"

AI LÀM:
  ✅ Xác nhận cảm xúc TRƯỚC khi làm gì khác
  ✅ Hỏi thêm, không giả định
  ✅ Không nói ngay "Nhưng học tập rất quan trọng..."

  "Cảm giác đó mình hiểu — khi bạn đã học nhiều mà không
  thấy đường ra, thật sự mệt mỏi lắm. Bạn đang cảm thấy
  chán vì kiệt sức, hay vì không thấy mục tiêu rõ ràng?"
```

#### 4.4 Implementation — Technical (Actual)

```
PIPELINE cho mỗi message (ChatController → AiService):

1. LLM Classifier (silent, 1 API call, gemini-2.5-flash)
   → AiService.classifySafeChat(message)
   → Input: message text only (no history context yet)
   → Output: { category: TopicCategory, shouldRedirect: boolean }
   → SAFE_CHAT_PROMPT from @javirs/ai-config

2. Save User Message
   → ChatService.saveMessage() with safeCategory attached
   → Category stored per-message in DB (encrypted)
   → SessionTopicStat.upsert() increments aggregate counter

3. Response Generation (branching)
   IF shouldRedirect (AGE_BOUNDARY | HARMFUL):
     → AiService.streamGentleRedirect()
     → Uses GENTLE_REDIRECT_PROMPT
   ELSE IF session.mode === OPEN:
     → AiService.streamOpenChat() [TODO — not yet wired]
     → Uses OPEN_CHAT_SYSTEM_PROMPT
   ELSE (SUBJECT mode):
     → AiService.streamChat()
     → Uses SOCRATIC_SYSTEM_PROMPT + RAG context

4. SSE Streaming
   → Response streamed via HTTP SSE (text/event-stream)
   → Format: data: {type: "text", content: chunk}
   → Final: data: {type: "done", metadata: {...}}

5. Save AI Response
   → ChatService.saveMessage() with AI metadata
   → tokensUsed, modelUsed, ragSources, wasRedirected

Aggregate Stats (SessionTopicStat → WeeklyTopicStat):
  ✅ Per-session category counts (academic, general, hobbies, life, redirected)
  ✅ Weekly aggregate flush (WeeklyTopicStat table)
  ❌ No individual message content exposed to parent
```

**Prompt Files:**
| File | Constant | Dùng khi |
|---|---|---|
| `prompts/classifier.ts` | `SAFE_CHAT_PROMPT` | Classify mọi message (silent) |
| `prompts/classifier.ts` | `CLASSIFIER_PROMPT` | Classify query complexity (SUBJECT mode) |
| `prompts/socratic.ts` | `SOCRATIC_SYSTEM_PROMPT` | Response khi SUBJECT mode |
| `prompts/socratic.ts` | `GENTLE_REDIRECT_PROMPT` | Redirect khi AGE_BOUNDARY/HARMFUL |
| `prompts/open-chat.ts` | `OPEN_CHAT_SYSTEM_PROMPT` | Response khi OPEN mode (F3+F4 combined) |

---

### F5: Photo Scanner

**Mô tả:** Học sinh chụp ảnh bài tập, đề thi, trang sách — AI phân tích và đưa vào luồng Socratic.

**Luồng:**
```
Student upload photo
  → Vision AI (GPT-4o Vision / Gemini Vision) extract text & math
  → Kết quả được format thành text query
  → Feeds vào Socratic Engine bình thường
  → AI hỏi ngược lại, không trả lời thẳng
```

**Giới hạn:**
- Chỉ chấp nhận ảnh liên quan đến học tập (academic content)
- Vision model sẽ nhận diện nếu ảnh không phải học thuật → gentle decline

---

### F6: Progress Tracking

**Mô tả:** Theo dõi tiến độ học tập và visualise điểm mạnh/yếu theo chủ đề.

**Các chỉ số theo dõi:**

| Metric | Cách thu thập | Hiển thị |
|---|---|---|
| Study time | Session duration tracking | Bar chart theo ngày |
| Topic mastery | % answers correct per topic | Progress bar 0–100% |
| Questions asked | Message count per subject | Count |
| KEY TERMS earned | AI detection khi student dùng đúng | Badge list |
| Streak | Consecutive study days | Streak counter |
| Weak areas | Topics với mastery < 50% | "Focus" card |

**Mastery Algorithm — Confidence-Weighted v1.1 (AI-Evaluated):**

```
─── Pipeline (per SUBJECT mode exchange) ─────────────────────────────────────

  1. Student sends message
  2. AI Socratic response streams to student
  3. [SILENT] Answer Evaluator (Gemini Flash, max 5 tokens) rates the message:
        NOT_ANSWER → student hỏi câu mới, không phải trả lời → SKIP, không tính điểm
        CORRECT    → học sinh trả lời đúng  → wasSuccessful = true
        PARTIAL    → trả lời chưa đủ/rõ    → wasSuccessful = false (câu hỏi được tính)
        INCORRECT  → trả lời sai           → wasSuccessful = false
  4. Nếu NOT_ANSWER → không update mastery
  5. Nếu CORRECT/PARTIAL/INCORRECT → update TopicProgress

─── Mastery Formula (Confidence-Weighted) ────────────────────────────────────

  accuracy     = correctAnswers / questionsAsked       ← chất lượng
  confidence   = min(1.0, questionsAsked / 5)          ← đủ dữ liệu chưa?
  masteryLevel = accuracy × confidence

─── Ví dụ progression ────────────────────────────────────────────────────────

  Trả lời 1 CORRECT   → acc=1.0, conf=0.20  → mastery = 20%  (Average)
  Trả lời 2 CORRECT   → acc=1.0, conf=0.40  → mastery = 40%  (Average)
  Trả lời 3 CORRECT   → acc=1.0, conf=0.60  → mastery = 60%  (Good)
  4 CORRECT / 5 total → acc=0.8, conf=1.00  → mastery = 80%  (Excellent)
  5 CORRECT / 5 total → acc=1.0, conf=1.00  → mastery = 100%
  3 CORRECT / 5 total → acc=0.6, conf=1.00  → mastery = 60%  (Good)
  Hỏi câu mới (NOT_ANSWER) → không tính gì cả.

─── Ghi chú về PARTIAL ───────────────────────────────────────────────────────

  PARTIAL: questionsAsked++, correctAnswers KHÔNG tăng
  → Mastery giảm nhẹ nếu đang ở mức cao (accuracy kéo xuống)
  → Khuyến khích học sinh trả lời đầy đủ, chính xác

─── Tier thresholds ──────────────────────────────────────────────────────────

  >= 80%  → ✓  Excellent  (xanh lá)
  50-79%  → ●  Good       (xanh dương)
  1-49%   → ◐  Average    (vàng)
  0%      → ○  Not started (xám)

─── Tại sao MIN_QUESTIONS = 5? ───────────────────────────────────────────────

  Cần ít nhất 5 lần thực sự TRẢ LỜI (không phải hỏi) để đánh giá
  chính xác. Tránh đạt Excellent chỉ từ 1-2 câu may mắn.
```

**Implementation files:**
- `packages/ai-config/src/prompts/classifier.ts` → `ANSWER_EVAL_PROMPT`
- `apps/api/src/modules/ai/ai.service.ts` → `evaluateAnswer()`
- `apps/api/src/modules/progress/progress.service.ts` → `updateTopicMastery()`
- `apps/api/src/modules/chat/chat.controller.ts` → pipeline kết nối sau stream

**Trigger:** Sau khi AI hoàn tất stream trong SUBJECT mode. Kết quả `masteryUpdate` gửi qua SSE `done` event để Frontend cập nhật sidebar ngay (optimistic update).



---

### F7: Parent Portal

**Mô tả:** Dashboard riêng cho phụ huynh — xem tổng quan học tập của con, không can thiệp vào nội dung chat.

**Nguyên tắc thiết kế Parent Portal:**

```
Phụ huynh nhìn thấy:           Phụ huynh KHÔNG nhìn thấy:
────────────────────────        ──────────────────────────────
✅ Tổng giờ học / tuần          ❌ Nội dung tin nhắn cụ thể
✅ Môn học đã ôn                ❌ Câu hỏi cụ thể học sinh hỏi
✅ Topic mastery %               ❌ Chủ đề "off-academic" học sinh hỏi
✅ Streak học                    ❌ Thống kê per-user về Safe Chat
✅ Weekly report PDF             ❌ Bất kỳ cờ hay cảnh báo cá nhân
✅ Aggregate topic distribution  ❌ Real-time monitoring
```

**Sections của Parent Portal:**
1. **Child Overview Card** — summary tuần
2. **Subject Progress** — progress bar từng môn
3. **Attention Alerts** — "Chưa học Chemistry 3 ngày, kỳ thi còn 18 ngày"
4. **Recent Activity** — danh sách sessions theo topic (không theo message)
5. **Weekly Report** — PDF tự động hàng tuần
6. **Anonymous Wellness Snapshot** (xem F8)

---

### F8: Anonymous Topic Analytics

**Mô tả:** Thống kê tổng hợp, ẩn danh về phân phối chủ đề trong các buổi chat — cung cấp cho phụ huynh như một "wellness signal" tổng thể, không phải dữ liệu cá nhân.

**Ví dụ Wellness Signals:**

| Signal | Điều kiện | Thông điệp hiển thị |
|---|---|---|
| Normal | Academic ≥ 50% | "Con đang tập trung tốt vào học tập." |
| Balanced | Academic 30–50% | "Con học đều và có không gian để trải lòng — lành mạnh." |
| Attention | Academic < 30% liên tiếp 5 ngày | "Con có thể đang trong giai đoạn căng thẳng — một cuộc trò chuyện nhẹ nhàng có thể giúp ích." |

**Dữ liệu kỹ thuật (anonymous):**

```sql
-- CHỈ lưu aggregate per student per week, KHÔNG có message content
CREATE TABLE weekly_topic_stats (
  id          UUID DEFAULT gen_random_uuid(),
  student_id  UUID,           -- only to join with parent account
  week_start  DATE,
  academic    INTEGER,        -- count of messages in category
  general     INTEGER,
  hobbies     INTEGER,
  life        INTEGER,
  -- NOT stored: harmful count, specific topics, message content
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. Chính sách Quyền riêng tư Học sinh

### 6.1 Privacy by Design

> **LinhIQ được thiết kế với nguyên tắc: học sinh có quyền có không gian an toàn để học và khám phá — phụ huynh có quyền biết con đang dùng app thế nào ở cấp độ tổng thể.**

### 6.2 Cam kết với học sinh (Student Privacy Promise)

LinhIQ cam kết:

```
1. Nội dung cuộc trò chuyện của bạn là của bạn.
   Chúng tôi không chia sẻ nội dung cụ thể với phụ huynh hay nhà trường.

2. Chúng tôi không "báo cáo" bạn.
   Nếu bạn hỏi điều gì tế nhị, Linh sẽ trả lời theo cách phù hợp nhất,
   không gắn cờ hay thông báo cho ai.

3. Thống kê tổng hợp (không tên, không nội dung) được chia sẻ
   với phụ huynh dưới dạng phần trăm chủ đề — không có gì nhận dạng được bạn.

4. Ngoại lệ duy nhất: nếu phát hiện nguy cơ an toàn nghiêm trọng
   (tự làm hại, gây hại người khác), LinhIQ sẽ cung cấp tài nguyên hỗ trợ
   và — trong trường hợp cực kỳ nghiêm trọng — liên hệ phụ huynh theo
   quy trình được thông báo trước trong Terms of Service.
```

### 6.3 Data Retention

| Data type | Retention | Lý do |
|---|---|---|
| Chat messages (encrypted) | 90 ngày | Cho continuity của session |
| Aggregate stats | 12 tháng | Cho báo cáo phụ huynh |
| Session metadata | 30 ngày | Debug và improvement |
| Safe Chat labels (per message) | KHÔNG lưu | Privacy |
| Safe Chat aggregate counts | 7 ngày (flush) | Sync vào weekly stats |

---

## 7. Không gian được phép & Không được phép

### Được phép (Cho phép và khuyến khích)

```
✅ Tất cả câu hỏi học thuật (Cambridge IGCSE/A-Level, THPT VN, và các chương trình được hỗ trợ)
✅ Câu hỏi khoa học, công nghệ, lịch sử, địa lý đại cương
✅ Sở thích: âm nhạc, phim, thể thao, gaming, nghệ thuật
✅ Câu hỏi về nghề nghiệp, tương lai, học đại học
✅ Câu hỏi về cảm xúc, stress học tập, tình bạn
✅ Học cách học, time management, ghi chú
✅ Tin tức, sự kiện thế giới (ở mức phù hợp tuổi)
✅ Ngôn ngữ, văn hoá, du lịch
```

### Được xử lý với careful redirect

```
⚠️ Chủ đề tình cảm (dating, tình yêu) → Validate + general conversation
⚠️ Câu hỏi về rượu bia, thuốc lá → Factual health info + redirect
⚠️ Bạo lực game/phim → Có thể thảo luận về mặt nghệ thuật/thiết kế
⚠️ Chính trị tranh cãi → Balanced perspectives, không chọn phe
⚠️ Tôn giáo → Respectful, factual, không phán xét
```

### Không bao giờ cung cấp

```
❌ Nội dung 18+ / khiêu dâm / gợi dục
❌ Hướng dẫn tự làm hại hay gây hại người khác
❌ Cách mua/sử dụng ma tuý, chất kích thích bất hợp pháp
❌ Thông tin dẫn đến hành vi nguy hiểm
❌ Nội dung kỳ thị, phân biệt chủng tộc, tôn giáo
```

---

## 8. Luồng người dùng chính

### User Flow 1: Học sinh mới đăng ký

```
Landing Page
  → Register (email/Google)
  → Onboarding Step 1: Chọn curriculum (Cambridge IGCSE / A-Level / THPT Việt Nam / Khác)
  → Onboarding Step 2: Chọn subjects (tối đa 3)
  → Onboarding Step 3: Diagnostic quiz (3 câu, có thể skip)
  → Dashboard
  → Chọn môn → Bắt đầu chat đầu tiên
```

### User Flow 2: Học sinh quay lại học

```
Login / Session restore
  → Dashboard (có "Continue where you left off")
  → Tiếp tục session, hoặc tạo session mới
  → Chat với Socratic AI
  → Có thể switch sang "Chat với Linh" mode bất cứ lúc nào
```

### User Flow 3: Học sinh dùng Open Chat

```
Dashboard → "Chat với Linh" (không chọn subject)
  → Open Chat mode
  → Hỏi bất kỳ chủ đề gì
  → F4 Safe Chat Filter hoạt động ngầm
  → AI trả lời phù hợp, redirect khi cần
  → Nếu câu hỏi học thuật → AI offer "Want me to explain
    this properly? Let's go to your Biology session."
```

### User Flow 4: Phụ huynh xem báo cáo

```
Parent login (tách biệt hoàn toàn với student login)
  → Parent Dashboard
  → Xem weekly summary card của con
  → Click "View Detailed Report" → weekly breakdown
  → Subject progress, study time charts
  → Anonymous Topic Distribution chart
  → Download PDF Report
```

---

## 9. Tiêu chí thành công (OKRs)

### Objective 1: Học sinh học thực sự hiệu quả

| Key Result | Target | Đo bằng |
|---|---|---|
| KR1.1 | 80% học sinh tăng topic mastery sau 30 ngày | Mastery % trước/sau |
| KR1.2 | Avg. sessions/week ≥ 4 | Session analytics |
| KR1.3 | 30-day retention ≥ 40% | Cohort analysis |
| KR1.4 | NPS học sinh ≥ 35 | Survey in-app |

### Objective 2: Phụ huynh tin tưởng và hiểu giá trị

| Key Result | Target | Đo bằng |
|---|---|---|
| KR2.1 | NPS phụ huynh ≥ 40 | Survey |
| KR2.2 | 60% phụ huynh xem weekly report | Analytics |
| KR2.3 | Churn rate phụ huynh < 5%/month | Subscription data |

### Objective 3: Môi trường an toàn và lành mạnh

| Key Result | Target | Đo bằng |
|---|---|---|
| KR3.1 | < 0.1% messages vượt age-appropriate | F4 analytics |
| KR3.2 | 0 escalations đến cơ quan bảo vệ trẻ em | Incident log |
| KR3.3 | 100% harmful content được redirect | F4 test suite |
| KR3.4 | Không có khiếu nại về privacy của học sinh | Support tickets |

---

## 10. Lộ trình phát triển

### Phase 1 — Foundation MVP (Tuần 1–8)

**Goal:** Học sinh có thể ôn 1 môn học (Cambridge IGCSE Biology) qua Socratic chat — đặt nền móng cho đa chương trình

| Deliverable | Owner | Tuần |
|---|---|---|
| Auth (login/register) | Full-stack | 1 |
| Database schema + seed | Backend | 1 |
| Socratic Engine (F1) | AI Eng | 2–3 |
| RAG Pipeline — Biology (F2) | AI Eng | 2–4 |
| Chat UI + SSE streaming | Frontend | 3–4 |
| Student Dashboard | Frontend | 4–5 |
| Progress tracking (cơ bản) | Full-stack | 5–6 |
| Safe Chat Filter v1 (F4) | AI Eng | 6–7 |
| Alpha test (10 internal testers) | All | 8 |

**Exit Criteria:** 10 học sinh internal có thể ôn IGCSE Biology, accuracy > 85% trên Past Papers; kiến trúc RAG hỗ trợ thêm curriculum mới chỉ bằng cách thêm data source

---

### Phase 2 — Open Chat + Safety (Tuần 9–14)

**Goal:** Mở rộng sang Open Chat, hoàn thiện hệ thống an toàn

| Deliverable | Owner | Tuần |
|---|---|---|
| Open Chat mode (F3) | AI Eng | 9–10 |
| Safe Chat Filter v2 (F4 full) | AI Eng | 10–11 |
| Anonymous Topic Analytics (F8) | Backend | 11–12 |
| Parent Portal — basic (F7) | Full-stack | 12–13 |
| Onboarding flow (3 steps) | Frontend | 13 |
| Beta launch (50 students) | All | 14 |

---

### Phase 3 — Growth (Tuần 15–22)

**Goal:** Public launch sẵn sàng

| Deliverable | Owner | Tuần |
|---|---|---|
| Photo Scanner (F5) | AI Eng | 15–16 |
| Quiz Generator | AI Eng | 15–17 |
| Parent Weekly Report PDF | Backend | 17–18 |
| THPT VN curriculum (F2) | AI Eng | 18–20 |
| PWA mobile optimization | Frontend | 20–21 |
| Public launch | All | 22 |

---

*LinhIQ Product Design Document v1.0*
*"Người bạn thông minh của em."*
*Last updated: April 2026*
