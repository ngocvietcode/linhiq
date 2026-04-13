"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Brain, BookOpen, Target, Check } from "lucide-react";

const DEMO_MESSAGES = [
  { role: "user", content: "What is osmosis?" },
  {
    role: "assistant",
    content:
      "Great question! Before I explain — what do you already know about how water moves between cells?",
  },
  {
    role: "user",
    content: "Water goes from less concentrated to more concentrated?",
  },
  {
    role: "assistant",
    content:
      "✅ KEY TERM earned: **concentration gradient**\n\nYou're almost there! Water actually moves from HIGH water potential (dilute) to LOW (concentrated). What type of membrane allows this?",
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Socratic Method",
    desc: "Teaches you to think, not copy answers",
  },
  {
    icon: BookOpen,
    title: "School Programs",
    desc: "Every answer grounded in your syllabus",
  },
  {
    icon: Target,
    title: "Mark Scheme Grading",
    desc: "Know exactly which words earn marks",
  },
];

const SUBJECTS = ["Biology", "Mathematics", "Chemistry", "Physics", "Economics"];

export default function HomePage() {
  const [activeMsg, setActiveMsg] = useState(0);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-void)", color: "var(--color-text-primary)" }}
    >
      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b"
        style={{
          background: "rgba(8,12,20,0.8)",
          backdropFilter: "blur(20px)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary text-sm px-4 py-2 gap-1">
            Start Free <ArrowRight size={14} />
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
              border: "1px solid rgba(99,102,241,0.3)",
              color: "var(--color-text-hint)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            Chương trình Quốc tế &amp; Việt Nam · AI-Powered
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-none tracking-tight mb-6 animate-fade-up"
            style={{ letterSpacing: "-0.025em" }}
          >
            Study smarter.
            <br />
            <span className="text-gradient">Not harder.</span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-xl mx-auto mb-10 animate-fade-up"
            style={{ color: "var(--color-text-secondary)", animationDelay: "80ms" }}
          >
            Your personal AI tutor for international and Vietnamese school programs. Answers your
            questions with questions — until you truly understand.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            <Link href="/register" className="btn-primary text-base px-7 py-3.5 gap-2">
              Try 3 Questions Free <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn-ghost text-base px-7 py-3.5">
              See how it works
            </Link>
          </div>

          {/* Subjects row */}
          <div className="flex flex-wrap justify-center gap-2 mb-24">
            <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Trusted for:</span>
            {SUBJECTS.map((s) => (
              <span key={s} className="tag" style={{ fontSize: 13 }}>
                {s}
              </span>
            ))}
          </div>

          {/* ── Chat Demo ── */}
          <div
            className="rounded-2xl border overflow-hidden max-w-2xl mx-auto shadow-2xl animate-fade-up"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border-subtle)",
              animationDelay: "240ms",
              boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
            }}
          >
            {/* window chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-elevated)" }}
            >
              <span className="w-3 h-3 rounded-full bg-danger/70" />
              <span className="w-3 h-3 rounded-full bg-warning/70" />
              <span className="w-3 h-3 rounded-full bg-success/70" />
              <span className="flex-1 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                🧬 Biology · IGCSE
              </span>
            </div>
            {/* messages */}
            <div className="p-6 space-y-4 text-left">
              {DEMO_MESSAGES.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
                  style={{ animationDelay: `${300 + i * 120}ms` }}
                >
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? {
                            background: "var(--color-accent)",
                            color: "#fff",
                            borderRadius: "18px 18px 4px 18px",
                          }
                        : {
                            background: "var(--color-elevated)",
                            color: "var(--color-text-primary)",
                            border: "1px solid var(--color-border-subtle)",
                            borderRadius: "4px 18px 18px 18px",
                          }
                    }
                  >
                    {msg.content.split("**").map((part, pi) =>
                      pi % 2 === 1 ? (
                        <strong key={pi} className="key-term">
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
                className="flex items-center gap-2 px-4 py-3 rounded-xl border mt-2"
                style={{ borderColor: "var(--color-border-default)", background: "var(--color-elevated)" }}
              >
                <span className="flex-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Ask anything...
                </span>
                <button className="btn-primary text-xs px-3 py-1.5">→</button>
              </div>
            </div>
            <div
              className="px-6 py-2 text-center text-xs border-t"
              style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-muted)" }}
            >
              Live demo — no signup needed
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section
          className="py-20 px-6"
          style={{ background: "var(--color-base)", borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-center text-3xl font-bold mb-3"
              style={{ letterSpacing: "-0.02em" }}
            >
              What makes LinhIQ different
            </h2>
            <p className="text-center mb-12" style={{ color: "var(--color-text-secondary)" }}>
              Built for serious exam prep, not just entertainment.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card text-center">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "var(--color-accent-soft)" }}
                  >
                    <Icon size={22} style={{ color: "var(--color-accent)" }} />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section
          className="py-20 px-6"
          style={{ background: "var(--color-void)", borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-center text-3xl font-bold mb-12"
              style={{ letterSpacing: "-0.02em" }}
            >
              Simple pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Free */}
              <div className="card">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-1">Free</h3>
                  <p className="text-4xl font-bold mt-3">$0</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {["10 questions / day", "1 subject", "Basic hints (L1-L3)"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      <Check size={14} style={{ color: "var(--color-success)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="btn-ghost w-full justify-center">
                  Start Free
                </Link>
              </div>
              {/* Pro */}
              <div
                className="card relative overflow-hidden"
                style={{
                  borderColor: "rgba(99,102,241,0.5)",
                  boxShadow: "var(--shadow-glow)",
                  background: "linear-gradient(135deg, rgba(99,102,241,0.08), var(--color-surface))",
                }}
              >
                <div
                  className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "var(--color-accent)", color: "#fff" }}
                >
                  POPULAR
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-1">Student Pro</h3>
                  <p className="text-4xl font-bold mt-3">
                    $15
                    <span className="text-lg font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      /mo
                    </span>
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "Unlimited questions",
                    "All subjects",
                    "Photo upload",
                    "Mark Scheme grading",
                    "Progress tracking",
                    "All 5 hint levels",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      <Check size={14} style={{ color: "var(--color-success)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="btn-primary w-full justify-center gap-2">
                  Get Pro <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="py-8 px-6 text-center text-sm border-t"
        style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-muted)" }}
      >
        © 2026 LinhIQ · Built for students
      </footer>
    </div>
  );
}
