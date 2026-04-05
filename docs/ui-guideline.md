# 🎨 LinhIQ — UI/UX Design System v2.0
**Target Users:** Teenagers (14–18) · Parents/Guardians
**Design Date:** April 2026

---

## PHẦN 1: TRIẾT LÝ THIẾT KẾ

### Hai ngữ cảnh, hai cảm xúc

| | Học sinh (Teenager) | Phụ huynh |
|---|---|---|
| **Mục tiêu cảm xúc** | Tập trung, tự tin, không bị phân tâm | Tin tưởng, yên tâm, nắm bắt được |
| **Môi trường sử dụng** | Tối phòng, đêm khuya, mobile | Ban ngày, laptop/tablet, có thời gian |
| **Nỗi sợ UX** | Bị overwhelm, nhàm chán, trẻ con hoá | Không hiểu gì, data không rõ ràng |
| **Màu cảm xúc** | Calm, Deep, Focused | Clean, Clear, Trustworthy |

---

## PHẦN 2: NGÔN NGỮ THIẾT KẾ

### 2.1 Tên phong cách: **"Calm Studio"**

> Lấy cảm hứng từ thiết kế của Linear, Vercel, Arc Browser — phong cách *minimal dark-first* cho
> power-users trẻ tuổi. Không phải childish gamification. Không phải corporate sterile.
> **Đẹp như app mà người lớn dùng, nhưng không đáng sợ.**

**3 nguyên tắc cốt lõi:**
1. **Không gian thở** — White space là đặc quyền. Mỗi element cần room to breathe.
2. **Màu sắc có mục đích** — Chỉ dùng màu khi cần dẫn hướng hành động hoặc trạng thái.
3. **Chuyển động có ý nghĩa** — Mọi animation đều phản ánh logic (không trang trí).

---

## PHẦN 3: DESIGN TOKENS

### 3.1 Color Palette

```
STUDENT INTERFACE (Dark Mode — Default)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background Layers:
  --bg-void:      #080C14   ← Màn hình chính (đen navy sâu, không harsh)
  --bg-base:      #0F172A   ← Base layer
  --bg-surface:   #1A2235   ← Cards, panels
  --bg-elevated:  #243044   ← Elevated modals, dropdowns

Accent (Primary Brand):
  --accent:       #6366F1   ← Indigo — thông minh, không agressive
  --accent-soft:  #6366F120 ← Tinted backgrounds
  --accent-glow:  #6366F140 ← Focus glow

Semantic:
  --success:      #22D3A3   ← Mint green — "đúng rồi!"
  --warning:      #F59E0B   ← Amber — "cần xem lại"
  --danger:       #F43F5E   ← Rose — errors

Text Hierarchy:
  --text-primary:   #F1F5F9   ← Đọc chính
  --text-secondary: #94A3B8   ← Labels, captions
  --text-muted:     #475569   ← Placeholder, disabled
  --text-hint:      #818CF8   ← AI hints (màu accent nhạt)

Border:
  --border-subtle:  #1E293B   ← Phân chia nhẹ
  --border-default: #334155   ← Default border
  --border-focus:   #6366F1   ← Focus/active state

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARENT INTERFACE (Light Mode — Default)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background:
  --bg-canvas:    #F8FAFC   ← Nền sáng, không chói
  --bg-card:      #FFFFFF   ← Cards
  --bg-subtle:    #F1F5F9   ← Sections, tables

Brand (same accent, lighter treatment):
  --accent:       #6366F1
  --accent-light: #EEF2FF

Text:
  --text-primary:   #0F172A
  --text-secondary: #475569
  --text-muted:     #94A3B8

Success / Data:
  --data-green:   #10B981
  --data-yellow:  #F59E0B
  --data-red:     #EF4444
  --data-blue:    #3B82F6
```

### 3.2 Typography

```
FONT CHÍNH: "Geist" (Vercel) hoặc "Plus Jakarta Sans" (Google)
→ Modern, clean, readable ở mọi size, tiếng Latin & số rõ ràng

FONT PHỤ (mono): "Geist Mono" hoặc "JetBrains Mono"  
→ Dùng cho: điểm số, code, công thức toán, timestamp

SCALE (Mobile-first):
  --text-xs:   11px / 1.4   → Labels, tags
  --text-sm:   13px / 1.5   → Captions, secondary info
  --text-base: 15px / 1.6   → Body text (đọc chính)
  --text-lg:   18px / 1.5   → Subheadings
  --text-xl:   22px / 1.4   → Section headings
  --text-2xl:  28px / 1.2   → Page titles
  --text-3xl:  36px / 1.1   → Hero

WEIGHT:
  300 → Light (long-form explanation text)
  400 → Regular (body)
  500 → Medium (UI labels)
  600 → SemiBold (headings)
  700 → Bold (CTA, emphasis)
```

### 3.3 Spacing & Shape

```
SPACING (4pt grid):
  4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96

BORDER RADIUS:
  --radius-sm:  6px    → Inputs, badges
  --radius-md:  10px   → Buttons, small cards
  --radius-lg:  16px   → Main cards
  --radius-xl:  24px   → Modals, large panels
  --radius-full: 999px → Pills, avatars

SHADOWS (Dark mode):
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.4)
  --shadow-md:  0 4px 16px rgba(0,0,0,0.5)
  --shadow-glow: 0 0 20px rgba(99,102,241,0.15)  ← Accent glow

SHADOWS (Light mode):
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.08)
  --shadow-md:  0 4px 12px rgba(0,0,0,0.10)
  --shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)
```

### 3.4 Motion

```
EASING:
  --ease-default: cubic-bezier(0.16, 1, 0.3, 1)  ← Spring feel
  --ease-out:     cubic-bezier(0, 0, 0.2, 1)
  --ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1)

DURATION:
  --duration-fast:   100ms  → Hover, toggle
  --duration-base:   200ms  → Button press, small transitions
  --duration-slow:   350ms  → Page transitions, modals
  --duration-stream: 30ms   → Token streaming animation

PRINCIPLES:
  · Enter animations: fade + translate-y(8px → 0)
  · Exit: faster than enter (100ms)
  · Loading skeleton: pulse 1.5s ease-in-out
  · Streaming text: word-by-word with cursor blink
  · Micro: scale(0.96) on button press
```

---

## PHẦN 4: COMPONENT LANGUAGE

### Buttons (Student)
```
PRIMARY (CTA):
  bg: #6366F1  |  text: white  |  radius: 10px  |  padding: 12px 20px
  hover: bg lighten 8%  |  active: scale(0.96)  |  transition: 150ms

SECONDARY (Ghost):
  bg: transparent  |  border: 1px solid --border-default
  text: --text-secondary  |  hover: border --accent, text --text-primary

TEXT BUTTON:
  No bg/border  |  text: --text-secondary  |  hover: text --text-primary

DANGER:
  bg: --danger/10  |  text: --danger  |  border: 1px solid --danger/30
```

### Chat Bubbles (KEY UI)
```
USER BUBBLE:
  bg: #6366F1  |  text: white
  radius: 18px 18px 4px 18px (bottom-right sharp)
  max-width: 70%  |  align: right

AI BUBBLE:
  bg: --bg-surface  |  border: 1px solid --border-subtle
  radius: 4px 18px 18px 18px (top-left sharp — AI "speaks")
  max-width: 75%  |  align: left
  
  → KEY TERM highlight: inline span, bg: --success/15, color: --success,
    border-radius: 4px, padding: 1px 6px
  → Hint badge: "💡 Hint Level 2" — pill above bubble

STREAMING INDICATOR:
  3 dots, bounce animation, staggered 150ms
  bg: --bg-surface  |  fits in AI bubble position
```

### Cards (Dashboard)
```
SUBJECT CARD (Student):
  bg: --bg-surface
  border: 1px solid --border-subtle
  radius: 16px  |  padding: 20px
  hover: border --accent/40, shadow --shadow-glow, translateY(-2px)
  
  Content layout:
  ┌─────────────────────┐
  │  [EMOJI] [Progress] │  ← Subject emoji + streak
  │                     │
  │  Biology            │  ← Subject name (text-xl semibold)
  │  IGCSE · Chapter 4  │  ← Curriculum + last position
  │                     │
  │  ████████░░ 78%     │  ← Progress bar (accent color)
  │                     │
  │  Continue →         │  ← CTA (text button)
  └─────────────────────┘
```

---

## PHẦN 5: TEXT MOCKUPS — STUDENT INTERFACE

### SCREEN 1: LANDING PAGE

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ●◐○  LinhIQ                              Sign in  Start → │  ← Nav (minimal)
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│                                                             │
│                    Study smarter.                           │
│               Not harder.                                   │
│                                                             │
│     Your personal AI tutor for Cambridge IGCSE & A-Level   │
│     Answers your questions with questions — until           │
│     you truly understand.                                   │
│                                                             │
│          [ Try 3 Questions Free → ]    [ See how it works ] │
│                                                             │
│                                                             │
│  ─────────────── Trusted for ───────────────               │
│  Biology · Mathematics · Chemistry · Physics · Eco          │
│                                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  "What is osmosis?"                                 │   │
│  │                                ● AI thinking...    │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Great question! Before I explain — what     │   │   │
│  │  │ do you already know about how water moves   │   │   │
│  │  │ between cells?                              │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  "Water goes from less concentrated to more?"       │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ ✅ KEY TERM earned: concentration gradient  │   │   │
│  │  │ You're on the right track! Now — what do    │   │   │
│  │  │ we call the type of membrane that allows    │   │   │
│  │  │ water through but not large molecules?      │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                          [    Ask anything...    ]  │   │
│  └─────────────────────────────────────────────────────┘   │
│              Live demo — no signup needed                   │
│                                                             │
│                                                             │
│  ──────── What makes LinhIQ different ────────             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │              │  │              │  │              │     │
│  │  🧠           │  │  📑           │  │  🎯           │     │
│  │ Socratic      │  │ Cambridge    │  │ Mark Scheme  │     │
│  │ Method       │  │ Aligned RAG  │  │ Grading      │     │
│  │              │  │              │  │              │     │
│  │ Teaches you  │  │ Every answer │  │ Know exactly │     │
│  │ to think,    │  │ grounded in  │  │ which words  │     │
│  │ not copy     │  │ your syllabus│  │ earn marks   │     │
│  │              │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│                                                             │
│  ──────── Pricing ────────                                  │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────────────────┐  │
│  │  Free             │  │  Student Pro         $15/mo   │  │
│  │  ──────────────── │  │  ──────────────────────────── │  │
│  │  10 questions/day │  │  ✓ Unlimited questions        │  │
│  │  1 subject        │  │  ✓ All subjects               │  │
│  │  Basic hints      │  │  ✓ Photo upload               │  │
│  │                   │  │  ✓ Mark Scheme grading        │  │
│  │  [ Start Free ]   │  │  ✓ Progress tracking          │  │
│  │                   │  │                               │  │
│  │                   │  │  [ Get Pro → ]                │  │
│  └───────────────────┘  └───────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### SCREEN 2: ONBOARDING — 3 BƯỚC (Post-signup)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  LinhIQ                                    Step 1 of 3 ○●○ │
│                                                             │
│                                                             │
│                  Hi, I'm LinhIQ.                            │
│             Your Cambridge AI tutor.                        │
│                                                             │
│         Let me set up your personalised experience.         │
│                                                             │
│                                                             │
│  Which curriculum are you studying?                         │
│                                                             │
│  ┌─────────────────────┐   ┌─────────────────────┐         │
│  │                     │   │                     │         │
│  │   IGCSE             │   │   A-Level           │         │
│  │   Grade 9–10        │   │   Grade 11–12        │         │
│  │   Age 14–16         │   │   Age 16–18          │         │
│  │                     │   │                     │         │
│  └─────────────────────┘   └─────────────────────┘         │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ← Back                              Continue →     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━ STEP 2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  LinhIQ                                    Step 2 of 3 ●○○ │
│                                                             │
│  Which subjects do you want to study?                       │
│  (Pick up to 3)                                             │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ ✓        │  │          │  │          │  │          │   │
│  │ 🧬        │  │ ⚗️        │  │ ∫         │  │ ⚡        │   │
│  │ Biology  │  │ Chemistry│  │ Maths    │  │ Physics  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌──────────┐  ┌──────────┐                                │
│  │          │  │          │                                │
│  │ 📊        │  │ 🌍        │                                │
│  │ Economics│  │ Geography│                                │
│  └──────────┘  └──────────┘                                │
│                                                             │
│  1 selected — Biology                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ← Back                              Continue →     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━ STEP 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  LinhIQ                                    Step 3 of 3 ○○● │
│                                                             │
│  Quick diagnostic — 3 questions                             │
│  Helps me understand where you are right now.              │
│                                                             │
│  Biology · Question 1 of 3                                  │
│  ──────────────────────────────────────────                 │
│                                                             │
│  What is the function of the cell membrane?                 │
│                                                             │
│  ○  Controls what enters and leaves the cell                │
│  ○  Produces energy for the cell                            │
│  ○  Controls cell division                                  │
│  ○  Stores genetic information                              │
│                                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ← Back                            Answer →         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  You can skip this — it only helps personalise your path   │
│                                     [ Skip diagnostic ]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### SCREEN 3: STUDENT DASHBOARD

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ●◐○  LinhIQ            🔔  [Minh]  ▾                      │  ← Nav
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│  Good evening, Minh. 🌙                                     │
│  Your Biology exam is in 12 days.                           │
│                                                             │
│                                                             │
│  ─── Continue where you left off ────────────────────────  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  🧬 Biology  ·  IGCSE                               │   │
│  │  Chapter 7: Transport in Humans                     │   │
│  │                                                     │   │
│  │  ████████████████░░░░  78% complete                 │   │
│  │                                                     │   │
│  │                            [ Continue →  ]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                                             │
│  ─── Your subjects ───────────────────────────────────── → │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │              │  │              │  │              │      │
│  │  🧬 Biology  │  │  ⚗️ Chemistry │  │  ∫ Maths     │      │
│  │              │  │              │  │              │      │
│  │  ██████░░░░  │  │  ████░░░░░░  │  │  ██░░░░░░░░  │      │
│  │  62%         │  │  41%         │  │  22%          │      │
│  │              │  │              │  │              │      │
│  │  Last: 2h ago│  │  Last: 3d ago│  │  Start →     │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│                                                             │
│  ─── Recent sessions ──────────────────────────────────┐   │
│                                                         │   │
│  🧬  What is osmosis?      Biology  · 25 min · Today    │   │
│  ───────────────────────────────────────────────────   │   │
│  ⚗️  Ionic vs Covalent...  Chemistry · 40 min · Mon     │   │
│  ───────────────────────────────────────────────────   │   │
│  🧬  Cell structure quiz   Biology   · 15 min · Sun     │   │
│                                                             │
│                                                             │
│  ─── Today's streak ──────────────────────────────────     │
│  🔥 7-day streak · Keep it up!                             │
│  M  T  W  T  F  S  S                                       │
│  ●  ●  ●  ●  ●  ●  ●                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
│ 🏠 Home  💬 Chat  📈 Progress  ⚙️ Settings               │  ← Bottom nav
└─────────────────────────────────────────────────────────────┘
```

---

### SCREEN 4: CHAT INTERFACE (Core Screen)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ← Back   🧬 Biology · IGCSE           Hint: [1][2][3]     │  ← Header
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│                                                             │
│          ┌─────────────────────────────────────┐           │
│          │ 💡 Hint Level 1 — Nudge             │           │
│          │                                     │           │
│          │ Great — you remembered osmosis!      │           │
│          │                                     │           │
│          │ Now think: *which direction* does   │           │
│          │ water move — and why?               │           │
│          │                                     │           │
│          │ (Think about concentration...)      │           │
│          └─────────────────────────────────────┘           │
│          LinhIQ · just now                                  │
│                                                             │
│                                                             │
│                          ┌──────────────────────────────┐  │
│                          │ From high concentration to   │  │
│                          │ low concentration?           │  │
│                          └──────────────────────────────┘  │
│                                           Minh · 2 min ago  │
│                                                             │
│                                                             │
│          ┌─────────────────────────────────────┐           │
│          │ ✅ KEY TERM: concentration gradient │           │
│          │                                     │           │
│          │ Almost! Water actually moves from   │           │
│          │ HIGH water potential to LOW — which  │           │
│          │ is from *dilute* to *concentrated*. │           │
│          │                                     │           │
│          │ What type of membrane allows this?  │           │
│          └─────────────────────────────────────┘           │
│          LinhIQ · just now                ●●●  typing...   │
│                                                             │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Ask LinhIQ...                                      │   │
│  │                                                     │   │
│  │                                    📷      [ → ]   │   │
│  └─────────────────────────────────────────────────────┘   │
│  Enter to send · Shift+Enter for new line                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━ CHAT — Empty State ━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ← Back   🧬 Biology · IGCSE           Hint: [1][2][3]     │
│                                                             │
│                                                             │
│                                                             │
│                          ●◐○                               │
│                         LinhIQ                              │
│                                                             │
│               Ready to study Biology.                       │
│             What would you like to explore?                  │
│                                                             │
│                                                             │
│  ─── Try asking ──────────────────────────────────────     │
│                                                             │
│  ┌──────────────────────┐   ┌──────────────────────┐       │
│  │ What is osmosis?     │   │ Explain respiration  │       │
│  └──────────────────────┘   └──────────────────────┘       │
│  ┌──────────────────────┐   ┌──────────────────────┐       │
│  │ Compare mitosis and  │   │ How does the heart   │       │
│  │ meiosis              │   │ pump blood?          │       │
│  └──────────────────────┘   └──────────────────────┘       │
│                                                             │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Ask LinhIQ...                             📷  [ → ]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### SCREEN 5: STUDENT PROGRESS

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Progress                          This week ▾             │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  ─── Study time this week ────────────────────────────     │
│                                                             │
│       Mon  Tue  Wed  Thu  Fri  Sat  Sun                     │
│  2h   ▓▓▓  ░░░  ▓▓▓▓ ▓▓   ▓▓▓▓ ░    ▓▓▓                    │
│  1h   ▓▓▓  ░░░  ▓▓▓▓ ▓▓   ▓▓▓▓ ░    ▓▓▓                    │
│  0h   ───  ───  ──── ──   ──── ─    ───                    │
│             Total: 8h 20min · +23% from last week          │
│                                                             │
│                                                             │
│  ─── Topic mastery — Biology ─────────────────────────     │
│                                                             │
│  ✅  Characteristics of Living Organisms  ████████████ 95% │
│  ✅  Cells                                ██████████░░ 84% │
│  ✅  Enzymes                              █████████░░░ 78% │
│  ⚠️  Nutrition in Plants                  ██████░░░░░░ 55% │
│  ⚠️  Nutrition in Humans                  █████░░░░░░░ 44% │
│  ──  Transport in Plants                  ████░░░░░░░░ 32% │
│  ──  Transport in Humans                  ██░░░░░░░░░░ 18% │
│  ──  Gas Exchange                         ░░░░░░░░░░░░  0% │
│                                                             │
│                                                             │
│  ─── Weak areas to focus on ──────────────────────────     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ⚠️ Nutrition in Plants                              │  │
│  │  You've asked 8 questions but still getting 45%     │  │
│  │  correct. Let's drill photosynthesis.               │  │
│  │                               [ Study this now → ] │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ─── Key terms earned (this week) ────────────────────     │
│                                                             │
│  [osmosis] [semi-permeable] [concentration gradient]        │
│  [chlorophyll] [photosynthesis] [active transport]          │
│  [+14 more]                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
│ 🏠 Home  💬 Chat  📈 Progress  ⚙️ Settings               │
└─────────────────────────────────────────────────────────────┘
```

---

## PHẦN 6: TEXT MOCKUPS — PARENT INTERFACE

```
TRIẾT LÝ PARENT PORTAL:
  · Light mode (parents thường dùng ban ngày, không quen dark UI)
  · Ngôn ngữ đơn giản, không jargon kỹ thuật
  · Data đơn giản: "Con học bao nhiêu" + "Con đang giỏi/yếu phần nào"
  · Không có chat — chỉ xem, không can thiệp vào học tập của con
```

### SCREEN 6: PARENT HOME

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ●◐○  LinhIQ Parent                               Mr. Hung ▾│  ← Light mode
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│  👋 Good morning, Mr. Hung.                                 │
│     Here's how Minh is doing this week.                     │
│                                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Minh · IGCSE Year 10                               │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  ⏱ 8h 20min studied this week   ↑ +23%             │   │
│  │  💬 47 questions asked this week                    │   │
│  │  🎯 78% of answers marked correct by AI             │   │
│  │  🔥 7-day study streak active                       │   │
│  │                                                     │   │
│  │  [  View Detailed Report →  ]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                                             │
│  ─── Subject overview ─────────────────────────────────    │
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │                │  │                │  │              │  │
│  │ 🧬 Biology     │  │ ⚗️ Chemistry    │  │ ∫ Maths      │  │
│  │                │  │                │  │              │  │
│  │ ██████████ 78% │  │ ████████░░ 62% │  │ ████░░░░ 41% │  │
│  │ Good progress  │  │ Steady         │  │ Needs focus  │  │
│  │                │  │                │  │              │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│                                                             │
│                                                             │
│  ─── Attention needed ─────────────────────────────────    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ⚠️  Minh hasn't studied Chemistry in 3 days.        │  │
│  │     The Chemistry exam is in 18 days.               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│                                                             │
│  ─── Recent activity ──────────────────────────────────    │
│                                                             │
│  Today    Biology 55min   Studied Transport in Humans       │
│  Today    Biology 25min   Asked about osmosis (5 Qs)       │
│  Monday   Chemistry 40min Studied Ionic Bonding             │
│  Sunday   Biology 30min   Completed quiz — 8/10 correct    │
│                                                             │
│                              [ View full history → ]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
│ 📊 Overview  📈 Reports  💬 Messages  ⚙️ Settings        │
└─────────────────────────────────────────────────────────────┘
```

---

### SCREEN 7: PARENT REPORT — Weekly Detail

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ← Back   Minh's Weekly Report                             │
│           Week of Mar 31 – Apr 6, 2026                      │
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│  ─── Study hours ──────────────────────────────────────    │
│                                                             │
│       Mon  Tue  Wed  Thu  Fri  Sat  Sun    Total            │
│       1h   0h   2h   1h   2h   0h   1.3h   8h 20min        │
│                                                             │
│  ─── Subject breakdown ────────────────────────────────    │
│                                                             │
│  Biology      ████████████░░░░░  5h 20min   64%            │
│  Chemistry    ██████░░░░░░░░░░░  2h 10min   26%            │
│  Mathematics  ██░░░░░░░░░░░░░░░  50min      10%            │
│                                                             │
│  ─── Topics studied this week ─────────────────────────    │
│                                                             │
│  🧬 Biology                                                  │
│     · Transport in Humans (2h 10min) — NEW topic           │
│     · Osmosis deep dive (1h 40min) — Reviewed              │
│     · Cell quiz (30min) — Scored 8/10                      │
│                                                             │
│  ⚗️ Chemistry                                                │
│     · Ionic vs Covalent Bonding (1h 20min)                 │
│     · Periodic Table review (50min)                        │
│                                                             │
│  ─── AI conversation summary ──────────────────────────    │
│                                                             │
│  47 questions asked this week. Key topics:                  │
│  · Osmosis & water potential (12 questions)                 │
│  · Blood circulation (8 questions)                          │
│  · Ionic bonding (7 questions)                              │
│                                                             │
│  Minh often asks follow-up questions after getting          │
│  hints — showing good persistence. ✨                        │
│                                                             │
│  ─── What Minh knows well ─────────────────────────────    │
│                                                             │
│  ✅ Osmosis and water potential                             │
│  ✅ Cell structure and function                             │
│  ✅ Enzyme activity                                         │
│                                                             │
│  ─── Areas to strengthen ──────────────────────────────    │
│                                                             │
│  ⚠️ Photosynthesis (only 55% correct)                       │
│  ⚠️ Mathematics overall (only 2 sessions this week)         │
│                                                             │
│                                                             │
│  [ ↓ Download PDF Report ]        [ Share with teacher ]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### SCREEN 8: AUTH FLOW (Combined Student + Parent)

```
━━━━━━━━━━━━━━━━━━━ LOGIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                       ●◐○  LinhIQ                           │
│                                                             │
│                                                             │
│                     Welcome back                            │
│                                                             │
│    ┌─────────────────────────────────────────────────┐     │
│    │  Email                                          │     │
│    │  ──────────────────────────────────────────     │     │
│    │  you@example.com                                │     │
│    └─────────────────────────────────────────────────┘     │
│                                                             │
│    ┌─────────────────────────────────────────────────┐     │
│    │  Password                                       │     │
│    │  ──────────────────────────────────────────     │     │
│    │  ●●●●●●●●                              [ 👁 ]   │     │
│    └─────────────────────────────────────────────────┘     │
│                                                             │
│                                   Forgot password?          │
│                                                             │
│    ┌─────────────────────────────────────────────────┐     │
│    │               Sign in →                         │     │
│    └─────────────────────────────────────────────────┘     │
│                                                             │
│    ─────────────── or continue with ───────────────        │
│                                                             │
│    [ 🟢  Google ]           [ 🍎  Apple ]                   │
│                                                             │
│                                                             │
│    Don't have an account?  Create one →                     │
│    Are you a parent?  Parent sign in →                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## PHẦN 7: DESIGN RATIONALE — TẠI SAO NHỮNG LỰA CHỌN NÀY

### Tại sao Indigo (#6366F1) thay vì Violet (#7C3AED)?

```
Violet (cũ) → liên tưởng đến: màu sắc, trendy, màu gen-Z Instagram
Indigo (mới) → liên tưởng đến: học thuật, thông minh, tập trung, trustworthy
                               (màu của Linear, Notion, Vercel)

Với học sinh 14-18: Indigo cảm thấy "serious enough" để học,
nhưng không boring như màu xanh corporate.
```

### Tại sao Dark Mode là default cho Student?

```
Research: 70%+ teen study sessions xảy ra vào buổi tối (8pm-12am)
→ Dark mode giảm eye strain trong phòng tối
→ Tạo cảm giác "focus mode" — giống IDE của lập trình viên
→ Teens perceived dark UI as "cooler" and more mature

Parent Portal Light Mode:
→ Parents use during daytime
→ Light mode easier to scan data/reports
→ Feels more "professional/trustworthy" for financial decisions
```

### Tại sao KHÔNG có gamification mạnh (points, levels, leaderboards)?

```
Target: IGCSE/A-Level students (14-18) — serious exam preparation
→ Leaderboards tạo anxiety, không phải motivation
→ Points/badges cảm thấy trẻ con với teenagers
→ Thay bằng: streak (đủ motivating), key terms earned (meaningful progress),
  topic mastery % (intrinsic reward)
```

### Tại sao Hint Level (1-2-3) là controls?

```
Student agency is crucial for 14-18 yr olds
→ Cảm giác kiểm soát = ít bị overwhelm hơn
→ L1 (nudge) → L2 (structure) → L3 (near-answer) = scaffolding
→ Tránh "just give me the answer" behavior
→ Teacher/parent approved pedagogy
```

---

## PHẦN 8: RESPONSIVE NOTES

```
MOBILE (375px) — PRIMARY for Student
  · Bottom navigation (5 tabs)  
  · Chat takes full screen
  · Subject cards: 1 column → horizontal scroll
  · Input fixed at bottom, safe area respected

TABLET (768px)
  · Side navigation (icon + label)
  · Chat + sidebar layout
  · Dashboard: 2-column grid

DESKTOP (1024px+)
  · Full sidebar navigation
  · Chat: max-width 800px, centered
  · Dashboard: 3-column grid
  · Parent portal gains data tables

PARENT PORTAL — DESKTOP FIRST
  · Reports and data better on larger screens
  · But mobile-responsive for checking on-the-go
```

---

## PHẦN 9: IMPLEMENTATION PRIORITY

| # | Screen | Complexity | Priority |
|---|---|:---:|:---:|
| 1 | Design Tokens / globals.css | Low | 🔴 P0 |
| 2 | Chat Interface (redesign) | Medium | 🔴 P0 |
| 3 | Login / Register | Low | 🔴 P0 |
| 4 | Student Dashboard | Medium | 🔴 P0 |
| 5 | Onboarding Flow (3 steps) | Low | 🟡 P1 |
| 6 | Progress Screen | Medium | 🟡 P1 |
| 7 | Landing Page | High | 🟡 P1 |
| 8 | Parent Portal – Home | Medium | 🟡 P1 |
| 9 | Parent Weekly Report | High | 🔴 P2 |
| 10 | Admin Settings | Low | 🔴 P2 |
