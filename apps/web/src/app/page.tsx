"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, Send, BookOpen, Brain, Target, BarChart2, Trophy, Compass } from "lucide-react";

const DEMO_MESSAGES = [
  { role: "user", content: "How does the heart pump blood?" },
  {
    role: "assistant",
    hint: 1,
    content:
      "Great topic! Before I explain — what do you already know about the *chambers* of the heart? How many are there?",
  },
  { role: "user", content: "4 chambers? Left and right sides?" },
  { role: "assistant", hint: 2, typing: true, content: "" },
];

const DEMO_FULL = [
  ...DEMO_MESSAGES.slice(0, -1),
  {
    role: "assistant",
    hint: 2,
    keyterm: "atria and ventricles",
    content:
      "Exactly! The 4 chambers are: 2 *atria* (top, receive blood) and 2 *ventricles* (bottom, pump blood out). Now — which side pumps to the *lungs*, and which to the *body*?",
  },
];

const FEATURES = [
  { icon: Brain,    title: "Socratic Chat",     desc: "AI không đưa đáp án. Mỗi câu trả lời kết thúc bằng một câu hỏi gợi mở." },
  { icon: BookOpen, title: "Chat + Sách",        desc: "Đọc sách bên trái, chat với AI bên phải. Click để AI giải thích ngay." },
  { icon: Target,   title: "Practice Mode",      desc: "Luyện đề IGCSE/A-Level chuẩn Mark Scheme, 5 cấp hint thông minh." },
  { icon: Compass,  title: "Explore Topics",     desc: "Khám phá toàn bộ curriculum, tìm điểm yếu và học có hệ thống." },
  { icon: Trophy,   title: "Leaderboard",        desc: "Thi đua cùng bạn bè, giữ streak và leo bảng xếp hạng." },
  { icon: BarChart2,title: "Progress Tracking",  desc: "Mastery từng topic, key terms kiếm được, weak areas cần ôn." },
];

const TAGS = ["Cambridge IGCSE", "A-Level", "THPT Việt Nam", "Biology", "Chemistry", "Mathematics", "Physics", "Economics"];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "4px 2px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--color-text-muted)",
            display: "inline-block",
            animation: `bounce-dot 1.4s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function HintBadge({ level }: { level: number }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px",
      borderRadius: 20, background: "var(--color-accent-soft)", border: "1px solid var(--color-accent-border)",
      fontSize: 11, fontWeight: 600, color: "var(--color-accent)", marginBottom: 6,
    }}>
      💡 Hint Level {level}
    </div>
  );
}

export default function HomePage() {
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowFull(true), 2400);
    return () => clearTimeout(t);
  }, []);

  const msgs = showFull ? DEMO_FULL : DEMO_MESSAGES;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-void)", color: "var(--color-text-primary)", overflowX: "hidden" }}>

      {/* Background grid */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 600, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(var(--color-border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-subtle) 1px, transparent 1px)",
        backgroundSize: "52px 52px",
        maskImage: "radial-gradient(ellipse at 50% 0%, black 20%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 20%, transparent 70%)",
      }} />
      {/* Background orb */}
      <div style={{
        position: "fixed", top: -100, left: "40%", width: 700, height: 700, pointerEvents: "none", zIndex: 0,
        borderRadius: "50%", background: "radial-gradient(ellipse, rgba(93,184,112,0.07) 0%, transparent 70%)", filter: "blur(4px)",
      }} />

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 32px",
        background: "rgba(8,9,10,0.7)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "var(--color-void)",
            boxShadow: "0 2px 12px var(--color-accent-glow)",
          }}>L</div>
          <span style={{ fontSize: 17, fontWeight: 800, color: "var(--color-text-primary)" }}>
            Linh<span style={{ color: "var(--color-accent)" }}>IQ</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "none", cursor: "pointer" }}>
            Sign in
          </Link>
          <Link href="/dashboard" style={{
            padding: "8px 20px", borderRadius: "var(--radius-md)",
            background: "var(--color-accent)", color: "var(--color-void)",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 4px 16px var(--color-accent-glow)",
          }}>
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "80px 24px 64px", position: "relative", zIndex: 5 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px",
          borderRadius: 999, background: "var(--color-accent-soft)", border: "1px solid var(--color-accent-border)",
          fontSize: 12, fontWeight: 600, color: "var(--color-accent)", marginBottom: 24,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
          Cambridge IGCSE · A-Level · THPT Việt Nam
        </div>

        <h1 style={{
          fontSize: "clamp(38px, 8vw, 78px)", fontWeight: 800,
          lineHeight: 1.06, letterSpacing: "-0.035em", marginBottom: 20,
        }}>
          Người bạn thông minh<br />
          <span className="text-gradient">của em.</span>
        </h1>

        <p style={{ fontSize: "clamp(15px, 2vw, 19px)", color: "var(--color-text-secondary)", maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.7 }}>
          AI không đưa đáp án — mà dạy em <strong style={{ color: "var(--color-text-primary)" }}>cách tư duy</strong>. Socratic method, bám sát giáo trình, đọc sách thông minh.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
          <Link href="/dashboard" style={{
            padding: "14px 32px", borderRadius: "var(--radius-md)",
            background: "var(--color-accent)", color: "var(--color-void)",
            fontSize: 15, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 8px 32px var(--color-accent-glow)",
            animation: "glow-pulse 3s ease-in-out infinite",
          }}>
            Trải nghiệm ngay →
          </Link>
          <Link href="/chat" style={{
            padding: "14px 32px", borderRadius: "var(--radius-md)",
            background: "transparent", border: "1px solid var(--color-border-default)",
            color: "var(--color-text-secondary)", fontSize: 15, fontWeight: 600, textDecoration: "none",
          }}>
            Xem Chat + Sách
          </Link>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 64 }}>
          {TAGS.map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>

        {/* Demo chat window */}
        <div style={{
          maxWidth: 560, margin: "0 auto",
          background: "var(--color-surface)", border: "1px solid var(--color-border-default)",
          borderRadius: 22, overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--color-accent-border)",
        }}>
          {/* Window chrome */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
            background: "var(--color-elevated)", borderBottom: "1px solid var(--color-border-subtle)",
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F45B69", opacity: 0.8 }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-gold)", opacity: 0.8 }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-accent)", opacity: 0.8 }} />
            <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>
              🧬 Biology IGCSE · Chat + Textbook
            </span>
          </div>
          {/* Messages */}
          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 14, minHeight: 200 }}>
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    maxWidth: "72%", padding: "11px 15px",
                    borderRadius: "16px 16px 4px 16px",
                    background: "var(--color-accent)", color: "var(--color-void)",
                    fontSize: 13, lineHeight: 1.6, fontWeight: 500,
                    boxShadow: "0 4px 16px var(--color-accent-glow)",
                  }}>
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "var(--color-void)",
                  }}>L</div>
                  <div style={{ maxWidth: "76%" }}>
                    {m.hint && <HintBadge level={m.hint} />}
                    <div style={{
                      padding: "11px 15px", borderRadius: "4px 16px 16px 16px",
                      background: "var(--color-elevated)", border: "1px solid var(--color-border-subtle)",
                      fontSize: 13, lineHeight: 1.65, color: "var(--color-text-primary)",
                    }}>
                      {m.typing ? (
                        <TypingDots />
                      ) : m.keyterm ? (
                        <>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px",
                            borderRadius: 6, background: "rgba(0,180,120,0.14)", border: "1px solid rgba(0,180,120,0.28)",
                            fontSize: 12, fontWeight: 600, color: "var(--color-teal)", marginBottom: 8, marginRight: 4,
                          }}>✅ KEY TERM: {m.keyterm}</span>
                          <span style={{ color: "var(--color-text-primary)" }}>{m.content}</span>
                        </>
                      ) : (
                        m.content.split("*").map((seg, si) =>
                          si % 2 === 1
                            ? <em key={si} style={{ fontStyle: "normal", fontWeight: 600, color: "var(--color-text-hint)" }}>{seg}</em>
                            : <span key={si}>{seg}</span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
          {/* Input bar */}
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{
              display: "flex", gap: 10, alignItems: "center",
              background: "var(--color-elevated)", border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-lg)", padding: "10px 14px",
            }}>
              <span style={{ flex: 1, fontSize: 13, color: "var(--color-text-muted)" }}>Hỏi LinhIQ bất cứ điều gì...</span>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: "var(--color-accent)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}>
                <Send size={13} color="var(--color-void)" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "72px 32px", borderTop: "1px solid var(--color-border-subtle)", position: "relative", zIndex: 5 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 16 }}>
            Tính năng nổi bật
          </h2>
          <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 16, maxWidth: 440, margin: "0 auto 56px", lineHeight: 1.65 }}>
            Từ đọc sách thông minh đến luyện đề — tất cả trong một nền tảng.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="card"
                  style={{ cursor: "default" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent-border)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border-subtle)";
                    (e.currentTarget as HTMLDivElement).style.transform = "none";
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: "var(--color-accent-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
                  }}>
                    <Icon size={18} style={{ color: "var(--color-accent)" }} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: "var(--color-text-primary)" }}>{f.title}</h4>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "28px 32px", borderTop: "1px solid var(--color-border-subtle)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        position: "relative", zIndex: 5,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "var(--color-void)",
          }}>L</div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>
            Linh<span style={{ color: "var(--color-accent)" }}>IQ</span>
          </span>
        </div>
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>© 2026 LinhIQ · "Người bạn thông minh của em."</span>
      </footer>
    </div>
  );
}
