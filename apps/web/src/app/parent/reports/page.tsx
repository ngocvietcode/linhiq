"use client";

import Link from "next/link";
import { ArrowLeft, Download, Share2, CheckCircle, AlertTriangle } from "lucide-react";

const STUDY_HOURS = [
  { day: "Mon", hours: 1 },
  { day: "Tue", hours: 0 },
  { day: "Wed", hours: 2 },
  { day: "Thu", hours: 1 },
  { day: "Fri", hours: 2 },
  { day: "Sat", hours: 0 },
  { day: "Sun", hours: 1.3 },
];

const SUBJECT_BREAKDOWN = [
  { emoji: "🧬", name: "Biology", hours: "5h 20min", pct: 64 },
  { emoji: "⚗️", name: "Chemistry", hours: "2h 10min", pct: 26 },
  { emoji: "∫", name: "Mathematics", hours: "50min", pct: 10 },
];

const TOPICS = [
  {
    subject: "Biology", emoji: "🧬",
    items: [
      { label: "Transport in Humans (2h 10min)", tag: "NEW topic" },
      { label: "Osmosis deep dive (1h 40min)", tag: "Reviewed" },
      { label: "Cell quiz (30min)", sub: "Scored 8/10" },
    ],
  },
  {
    subject: "Chemistry", emoji: "⚗️",
    items: [
      { label: "Ionic vs Covalent Bonding (1h 20min)", tag: "" },
      { label: "Periodic Table review (50min)", tag: "" },
    ],
  },
];

const KEY_TOPICS = [
  "Osmosis & water potential (12 questions)",
  "Blood circulation (8 questions)",
  "Ionic bonding (7 questions)",
];

const STRENGTHS = [
  "Osmosis and water potential",
  "Cell structure and function",
  "Enzyme activity",
];
const WEAKNESSES = [
  { topic: "Photosynthesis", note: "only 55% correct" },
  { topic: "Mathematics overall", note: "only 2 sessions this week" },
];

export default function ParentReportPage() {
  const maxH = Math.max(...STUDY_HOURS.map((d) => d.hours), 2);
  const totalH = STUDY_HOURS.reduce((s, d) => s + d.hours, 0);
  const totalHStr = `${Math.floor(totalH)}h ${Math.round((totalH % 1) * 60)}min`;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-void)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 border-b flex items-center gap-4"
        style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
        <Link href="/parent" className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)")}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
            Minh&apos;s Weekly Report
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Week of Mar 31 – Apr 6, 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm px-3 py-2 gap-1.5">
            <Download size={14} /> PDF
          </button>
          <button className="btn-ghost text-sm px-3 py-2 gap-1.5">
            <Share2 size={14} /> Share
          </button>
        </div>
      </header>

      <main className="px-5 md:px-8 py-8 max-w-3xl mx-auto space-y-8">
        {/* Study hours chart */}
        <section className="rounded-2xl border p-6"
          style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--color-text-muted)" }}>
            STUDY HOURS
          </h2>
          <div className="flex items-end gap-3 h-24 mb-3">
            {STUDY_HOURS.map(({ day, hours }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-mono font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  {hours > 0 ? `${hours}h` : ""}
                </span>
                <div
                  className="w-full rounded-md"
                  style={{
                    height: `${Math.max((hours / maxH) * 100, 4)}%`,
                    background: hours > 0
                      ? "linear-gradient(to top, rgba(218,119,86,1), rgba(218,119,86,0.7))"
                      : "var(--color-surface)",
                    transition: "height 0.6s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t pt-4"
            style={{ borderColor: "var(--color-border-subtle)" }}>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Total this week</span>
            <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{totalHStr}</span>
          </div>
        </section>

        {/* Subject breakdown */}
        <section className="rounded-2xl border p-6"
          style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--color-text-muted)" }}>
            SUBJECT BREAKDOWN
          </h2>
          <div className="space-y-4">
            {SUBJECT_BREAKDOWN.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{s.emoji}</span>
                    <span className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{s.hours}</span>
                    <span className="text-sm font-bold w-8 text-right" style={{ color: "var(--color-text-primary)" }}>{s.pct}%</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Topics studied */}
        <section className="rounded-2xl border p-6"
          style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--color-text-muted)" }}>
            TOPICS STUDIED THIS WEEK
          </h2>
          {TOPICS.map((t) => (
            <div key={t.subject} className="mb-5 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <span>{t.emoji}</span>
                <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{t.subject}</span>
              </div>
              <ul className="space-y-2 pl-6">
                {t.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span style={{ color: "var(--color-text-muted)", marginTop: 2 }}>·</span>
                    <div>
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
                      {item.tag && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(218,119,86,0.1)", color: "var(--color-accent)" }}>
                          {item.tag}
                        </span>
                      )}
                      {item.sub && (
                        <span className="ml-2 text-xs" style={{ color: "var(--color-success)" }}>— {item.sub}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* AI summary */}
        <section className="rounded-2xl border p-6"
          style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
            AI CONVERSATION SUMMARY
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            47 questions asked this week. Key topics:
          </p>
          <ul className="space-y-1.5 mb-5">
            {KEY_TOPICS.map((kp) => (
              <li key={kp} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <span style={{ color: "var(--color-accent)" }}>·</span> {kp}
              </li>
            ))}
          </ul>
          <div className="rounded-lg p-4 border"
            style={{ background: "rgba(218,119,86,0.04)", borderColor: "rgba(218,119,86,0.15)" }}>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Minh often asks follow-up questions after getting hints — showing good persistence. ✨
            </p>
          </div>
        </section>

        {/* Strengths & weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section className="rounded-2xl border p-5"
            style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
              WHAT MINH KNOWS WELL
            </h2>
            <ul className="space-y-3">
              {STRENGTHS.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-primary)" }}>
                  <CheckCircle size={14} style={{ color: "var(--color-success)", flexShrink: 0 }} />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border p-5"
            style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
              AREAS TO STRENGTHEN
            </h2>
            <ul className="space-y-3">
              {WEAKNESSES.map((w) => (
                <li key={w.topic} className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={14} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <span style={{ color: "var(--color-text-primary)" }}>{w.topic}</span>
                    <span className="text-xs ml-1" style={{ color: "var(--color-text-muted)" }}>({w.note})</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
