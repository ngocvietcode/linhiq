"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { ArrowRight, Brain, Target, Check, Sparkles, LineChart, ShieldCheck, Sun, Moon } from "lucide-react";

const DEMO_MESSAGES = [
  { role: "user", content: "Làm sao để đạt band 7.0 Writing IELTS task 2?" },
  {
    role: "assistant",
    content:
      "Một mục tiêu tuyệt vời! Để đạt 7.0, tiêu chí quan trọng nhất là **Task Response** và **Coherence**. Bạn định viết về chủ đề gì trước tiên?",
  },
  {
    role: "user",
    content: "Mình định viết về ưu nhược điểm của công nghệ trong giáo dục.",
  },
  {
    role: "assistant",
    content:
      "✅ Điểm tốt! Để phát triển ý (develop ideas) sâu hơn thay vì liệt kê, hãy thử dùng cấu trúc: **Idea -> Explain -> Example**. Bạn có thể đưa ra một lợi ích cụ thể và giải thích nó không?",
  },
];
const PROGRAMS = [
  "Cambridge IGCSE",
  "A-Level",
  "IELTS",
  "TOEIC",
  "Toán thi Đại học",
  "Khoa học Tự nhiên",
];

const STUDENT_FEATURES = [
  {
    icon: Sparkles,
    title: "Học tập không áp lực",
    desc: "AI đóng vai trò như một người bạn đồng hành giải đáp mọi thắc mắc mọi lúc mọi nơi.",
  },
  {
    icon: Brain,
    title: "Phương pháp Socratic",
    desc: "Không chỉ đưa ra đáp án, AI sẽ hướng dẫn bạn tự suy nghĩ để tìm ra câu trả lời.",
  },
  {
    icon: Target,
    title: "Luyện thi thực chiến",
    desc: "Cọ xát với các bộ đề thi IGCSE, A-Level, IELTS sát với thực tế nhất.",
  },
];

const PARENT_FEATURES = [
  {
    icon: Check,
    title: "Chấm điểm chuẩn Mark Scheme",
    desc: "Đánh giá chính xác theo barem của Cambridge và các kỳ thi quốc tế.",
  },
  {
    icon: LineChart,
    title: "Theo dõi tiến độ chi tiết",
    desc: "Nắm bắt được sự tiến bộ của con qua từng bài học một cách rõ ràng.",
  },
  {
    icon: ShieldCheck,
    title: "Tiết kiệm chi phí, an tâm tuyệt đối",
    desc: "Sử dụng AI thông minh với chi phí cực kỳ tối ưu, nội dung an toàn.",
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"students" | "parents">("students");
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ background: "var(--color-surface-1)", color: "var(--color-text-primary)" }}
    >
      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b transition-all"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold">
            <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent)" }}>Linh</span>
            <span style={{ color: "var(--color-text-heading)" }}>IQ</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border transition-colors cursor-pointer"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/login" className="btn-primary text-sm px-4 py-2 gap-1 whitespace-nowrap">
            Đăng nhập <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-8"
            style={{
              background: "var(--color-accent-soft)",
              border: "1px solid var(--color-accent-border)",
              color: "var(--color-accent-text)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            Tâm huyết từ những người làm cha mẹ
          </div>

          <h1
            className="text-3xl sm:text-5xl lg:text-7xl font-semibold leading-tight mb-6 animate-fade-up"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.025em" }}
          >
            Dẫn dắt tư duy qua <span style={{ color: "var(--color-accent)" }}>từng câu hỏi</span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-up leading-relaxed"
            style={{ color: "var(--color-text-secondary)", animationDelay: "80ms" }}
          >
            Được xây dựng bởi sự thấu hiểu của phụ huynh. LinhIQ không đưa ra lời giải tức thì, mà đóng vai trò như một gia sư kiên nhẫn — liên tục đặt câu hỏi và gợi ý từng bước (hints), giúp con tự mình đi tìm đáp án và thực sự làm chủ kiến thức.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            <Link href="/login" className="btn-primary text-base px-8 py-3.5 gap-2 w-full sm:w-auto">
              Trải nghiệm ngay <ArrowRight size={16} />
            </Link>
          </div>

          {/* Subjects row */}
          <div className="flex flex-col items-center gap-3 mb-24 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <p className="max-w-2xl text-center text-sm sm:text-base leading-relaxed px-4" style={{ color: "var(--color-text-muted)" }}>
              Hỗ trợ đắc lực <strong>bám sát chương trình học</strong> trên trường lớp, kết hợp hoàn hảo cùng <strong>Learnbook</strong> tương tác, tạo đà vững chắc cho mọi lộ trình của con:
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-2">
              {PROGRAMS.map((s) => (
                <span key={s} className="tag transition-colors hover:border-[var(--color-accent)]" style={{ fontSize: 13 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* ── Chat Demo ── */}
          <div
            className="rounded-xl border overflow-hidden max-w-3xl mx-auto animate-fade-up transition-all"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border-default)",
              animationDelay: "240ms",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {/* window chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-surface-0)" }}
            >
              <span className="w-3 h-3 rounded-full bg-danger/70" />
              <span className="w-3 h-3 rounded-full bg-warning/70" />
              <span className="w-3 h-3 rounded-full bg-success/70" />
              <span className="flex-1 text-center text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                Tiếng Anh · IELTS Writing
              </span>
            </div>
            {/* messages */}
            <div className="p-6 space-y-5 text-left">
              {DEMO_MESSAGES.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
                  style={{ animationDelay: `${300 + i * 120}ms` }}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                      ? {
                          background: "var(--color-accent)",
                          color: "#fff",
                          borderRadius: "12px 12px 4px 12px",
                        }
                        : {
                          background: "var(--color-surface-0)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-border-default)",
                          borderRadius: "4px 12px 12px 12px",
                        }
                    }
                  >
                    {msg.content.split("**").map((part, pi) =>
                      pi % 2 === 1 ? (
                        <strong key={pi} className="key-term px-1.5 py-0.5 rounded">
                          {part}
                        </strong>
                      ) : (
                        <span key={pi}>{part}</span>
                      )
                    )}
                  </div>
                </div>
              ))}
              {/* input */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl border mt-4 transition-colors focus-within:border-[var(--color-accent)]/50"
                style={{ borderColor: "var(--color-border-default)", background: "var(--color-surface-0)" }}
              >
                <span className="flex-1 text-sm outline-none cursor-text" style={{ color: "var(--color-text-muted)" }}>
                  Hỏi bài tập của bạn...
                </span>
                <button className="btn-primary text-xs px-4 py-2 rounded-lg">→</button>
              </div>
            </div>
            <div
              className="px-6 py-2.5 text-center text-xs border-t font-medium"
              style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-muted)", background: "var(--color-surface-0)" }}
            >
              Trải nghiệm trực tiếp không giới hạn
            </div>
          </div>
        </section>

        {/* ── Socratic Method Section ── */}
        <section
          className="py-24 px-6 relative"
          style={{ background: "var(--color-surface-1)", borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <div className="max-w-5xl mx-auto text-center">
            <h2
              className="text-3xl sm:text-4xl font-semibold mb-6"
              style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
            >
              Học thật, <span style={{ color: "var(--color-accent)" }}>Hiểu sâu</span>
            </h2>
            <p className="text-lg mb-16 max-w-3xl mx-auto leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Nhận đáp án có sẵn từ các công cụ AI thông thường khiến con hình thành thói quen lười tư duy, học vẹt. Tại LinhIQ, chúng tôi áp dụng <strong>phương pháp gợi mở Socratic</strong> — tuyệt đối KHÔNG bao giờ "mớm" đáp án trực tiếp làm thui chột tư duy của học sinh.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {/* Bad approach */}
              <div className="p-5 md:p-8 rounded-xl border" style={{ borderColor: 'rgba(166,61,64,0.2)', background: 'var(--color-danger-soft)' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl" style={{ background: 'rgba(166,61,64,0.1)', color: 'var(--color-danger)' }}>✕</div>
                  <h3 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>AI Thông Thường</h3>
                </div>
                <ul className="space-y-4" style={{ color: "var(--color-text-secondary)" }}>
                  <li className="flex gap-3"><span style={{ color: 'var(--color-danger)' }} className="mt-1">▪</span> Cung cấp đáp án và bài giải chi tiết ngay lập tức.</li>
                  <li className="flex gap-3"><span style={{ color: 'var(--color-danger)' }} className="mt-1">▪</span> Học sinh chỉ việc sao chép lại để nộp bài cho xong.</li>
                  <li className="flex gap-3"><span style={{ color: 'var(--color-danger)' }} className="mt-1">▪</span> Điểm số ảo trên lớp cao, nhưng mất gốc kiến thức căn bản.</li>
                  <li className="flex gap-3"><span style={{ color: 'var(--color-danger)' }} className="mt-1">▪</span> Quen với sự dễ dãi, sợ suy nghĩ khi gặp bài khó trong phòng thi.</li>
                </ul>
              </div>

              {/* Socratic approach */}
              <div className="p-5 md:p-8 rounded-xl border relative overflow-hidden" style={{ borderColor: 'rgba(46,125,79,0.3)', background: 'rgba(46,125,79,0.04)' }}>
                <div className="absolute -bottom-4 -right-4 p-4 opacity-5">
                  <Brain size={180} />
                </div>
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl" style={{ background: 'rgba(46,125,79,0.1)', color: 'var(--color-success)' }}>✓</div>
                  <h3 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: 'var(--color-success)' }}>Gia sư LinhIQ</h3>
                </div>
                <ul className="space-y-4 relative z-10">
                  <li className="flex gap-3"><span style={{ color: 'var(--color-success)' }} className="mt-1">▪</span> Đặt các câu hỏi gợi mở ngược lại để kích thích não bộ hoạt động.</li>
                  <li className="flex gap-3"><span style={{ color: 'var(--color-success)' }} className="mt-1">▪</span> Chia nhỏ vấn đề thành các bước để con tự tìm ra mấu chốt.</li>
                  <li className="flex gap-3"><span style={{ color: 'var(--color-success)' }} className="mt-1">▪</span> Cung cấp 5 cấp độ gợi ý (Hints) tùy thuộc vào sức học của con.</li>
                  <li className="flex gap-3 font-medium"><span style={{ color: 'var(--color-success)' }} className="mt-1">▪</span> Giúp con thực sự làm chủ kiến thức và tự tin giải quyết vấn đề.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Audience Section (Students / Parents) ── */}
        <section
          className="py-24 px-6 relative"
          style={{ background: "var(--color-surface-0)", borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2
                className="text-3xl sm:text-4xl font-semibold mb-4"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
              >
                Góc nhìn trọn vẹn
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
                Được tạo ra bởi chính những phụ huynh, chúng tôi thấu hiểu những khó khăn
                khi con lấp lửng giữa biển kiến thức khổng lồ và nỗi lo âu của ba mẹ.
              </p>
            </div>

            {/* Toggle */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex p-1 rounded-lg border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border-default)' }}>
                <button
                  onClick={() => setActiveTab("students")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === "students"
                      ? "bg-[var(--color-accent)] text-white shadow-md"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  Dành cho Học Sinh
                </button>
                <button
                  onClick={() => setActiveTab("parents")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === "parents"
                      ? "bg-[var(--color-accent)] text-white shadow-md"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  Dành cho Phụ Huynh
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" key={activeTab}>
              {(activeTab === "students" ? STUDENT_FEATURES : PARENT_FEATURES).map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card text-center hover:-translate-y-1 transition-transform duration-300">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"
                    style={{ background: "var(--color-accent-soft)" }}
                  >
                    <Icon size={26} style={{ color: "var(--color-accent)" }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="py-10 px-6 text-center text-sm border-t"
        style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-muted)" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-base font-semibold">
            <span>
              <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent)" }}>Linh</span>
              <span style={{ color: "var(--color-text-primary)" }}>IQ</span>
            </span>
          </div>
          <div>© {new Date().getFullYear()} LinhIQ. Phát triển từ tình yêu thương của cha mẹ dành cho con.</div>
        </div>
      </footer>
    </div>
  );
}
