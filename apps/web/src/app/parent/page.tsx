"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart2, MessageSquare, Settings,
  TrendingUp, TrendingDown, AlertCircle, Clock, CheckCircle,
  Flame
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/parent", icon: LayoutDashboard, label: "Overview" },
  { href: "/parent/reports", icon: BarChart2, label: "Reports" },
  { href: "/parent/messages", icon: MessageSquare, label: "Messages" },
  { href: "/parent/settings", icon: Settings, label: "Settings" },
];

// Static demo data — in production would come from API
const STUDENT = {
  name: "Minh",
  curriculum: "IGCSE Year 10",
  studyHoursWeek: "8h 20min",
  studyHoursChange: "+23%",
  questionsWeek: 47,
  correctPct: 78,
  streakDays: 7,
};

const SUBJECTS = [
  { emoji: "🧬", name: "Biology", mastery: 78, status: "good", label: "Good progress" },
  { emoji: "⚗️", name: "Chemistry", mastery: 62, status: "ok", label: "Steady" },
  { emoji: "∫", name: "Mathematics", mastery: 41, status: "warn", label: "Needs focus" },
];

const ATTENTION = [
  { icon: AlertCircle, text: "Minh hasn't studied Chemistry in 3 days.", sub: "The Chemistry exam is in 18 days." },
];

const RECENT_ACTIVITY = [
  { date: "Today", subject: "Biology", duration: "55min", note: "Studied Transport in Humans" },
  { date: "Today", subject: "Biology", duration: "25min", note: "Asked about osmosis (5 questions)" },
  { date: "Monday", subject: "Chemistry", duration: "40min", note: "Studied Ionic Bonding" },
  { date: "Sunday", subject: "Biology", duration: "30min", note: "Completed quiz — 8/10 correct" },
];

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.FC<{ size: number; style?: React.CSSProperties }>;
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl border p-4"
      style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color }} />
        <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{sub}</p>}
    </div>
  );
}

export default function ParentHomePage() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-void)" }}>
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 border-r"
        style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
        <div className="px-5 py-6 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <span className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ{" "}
            <span className="text-sm font-normal" style={{ color: "var(--color-text-muted)" }}>Parent</span>
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? "rgba(99,102,241,0.08)" : "transparent",
                  color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                }}>
                <Icon size={18} />{label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Mr. Hung</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Parent account</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 md:ml-0">
        {/* Header */}
        <header className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between"
          style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
              👋 Good morning, Mr. Hung.
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Here&apos;s how Minh is doing this week.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm font-medium px-3 py-1.5 rounded-full border"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
              This week ▾
            </span>
          </div>
        </header>

        <main className="px-5 md:px-8 py-8 max-w-4xl mx-auto">
          {/* Student summary card */}
          <section className="rounded-2xl border p-6 mb-8"
            style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-md)" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{STUDENT.name}</h2>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{STUDENT.curriculum}</p>
              </div>
              <Link href="/parent/reports"
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: "var(--color-accent)" }}>
                View Detailed Report <TrendingUp size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={Clock as React.FC<{ size: number; style?: React.CSSProperties }>}
                label="Study time"
                value={STUDENT.studyHoursWeek}
                sub={`↑ ${STUDENT.studyHoursChange} vs last week`}
                color="var(--color-accent)"
              />
              <StatCard
                icon={MessageSquare as React.FC<{ size: number; style?: React.CSSProperties }>}
                label="Questions asked"
                value={`${STUDENT.questionsWeek}`}
                sub="this week"
                color="#3B82F6"
              />
              <StatCard
                icon={CheckCircle as React.FC<{ size: number; style?: React.CSSProperties }>}
                label="Accuracy"
                value={`${STUDENT.correctPct}%`}
                sub="AI-graded"
                color="#10B981"
              />
              <StatCard
                icon={Flame as React.FC<{ size: number; style?: React.CSSProperties }>}
                label="Streak"
                value={`${STUDENT.streakDays} days`}
                sub="active"
                color="#F59E0B"
              />
            </div>
          </section>

          {/* Subject overview */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
              SUBJECT OVERVIEW
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SUBJECTS.map((s) => (
                <div key={s.name} className="rounded-xl border p-5"
                  style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.name}</span>
                  </div>
                  <div className="progress-bar mb-2">
                    <div className="progress-fill" style={{
                      width: `${s.mastery}%`,
                      background: s.status === "good"
                        ? "var(--color-success)"
                        : s.status === "warn"
                        ? "var(--color-warning)"
                        : "var(--color-accent)",
                    }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{s.label}</span>
                    <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{s.mastery}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Attention needed */}
          {ATTENTION.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
                ATTENTION NEEDED
              </h2>
              {ATTENTION.map((a, i) => (
                <div key={i} className="rounded-xl border p-4 flex items-start gap-3"
                  style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.2)" }}>
                  <AlertCircle size={16} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{a.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{a.sub}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Recent activity */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
                RECENT ACTIVITY
              </h2>
              <Link href="/parent/reports" className="text-sm" style={{ color: "var(--color-accent)" }}>
                View full history →
              </Link>
            </div>
            <div className="rounded-xl border overflow-hidden"
              style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{ borderBottom: i < RECENT_ACTIVITY.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                  <div className="w-20 flex-shrink-0">
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{a.date}</span>
                  </div>
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: "var(--color-surface)" }}>
                    {SUBJECTS.find((s) => s.name === a.subject)?.emoji || "📚"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{a.note}</span>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>{a.duration}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
