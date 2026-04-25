"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ChevronRight, AlertTriangle, BookOpen, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";

interface TopicMastery {
  topicName: string;
  mastery: number;
  questionsAsked: number;
}

interface SubjectProgress {
  id: string;
  name: string;
  iconEmoji: string;
  curriculum: string;
  overallMastery: number;
  topics: TopicMastery[];
}

interface ProgressOverview {
  streakDays: number;
  studyTimeMin: number;
  subjects: SubjectProgress[];
}

interface StudyHourPoint { date: string; minutes: number }

interface ChatStats {
  totals: {
    academic: number; general: number; hobbies: number; life: number;
    redirected: number; totalMsg: number;
  };
  ratios: {
    academic: number; general: number; hobbies: number; life: number; redirected: number;
  };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORY_META = [
  { key: "academic",   label: "Học tập",   color: "var(--color-accent)"  },
  { key: "general",    label: "Tổng quát", color: "var(--color-teal)"    },
  { key: "hobbies",    label: "Sở thích",  color: "var(--color-gold)"    },
  { key: "life",       label: "Đời sống",  color: "#8B5CF6"              },
  { key: "redirected", label: "Chuyển hướng", color: "var(--color-warning)" },
] as const;

function MasteryIndicator({ pct }: { pct: number }) {
  if (pct >= 80) return <span className="text-xs font-bold" style={{ color: "var(--color-success)" }}>●</span>;
  if (pct >= 50) return <span className="text-xs font-bold" style={{ color: "var(--color-warning)" }}>◐</span>;
  return <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>○</span>;
}

function ProgressContent() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [studyHours, setStudyHours] = useState<StudyHourPoint[]>([]);
  const [chatStats, setChatStats] = useState<ChatStats | null>(null);
  const [activeSubject, setActiveSubject] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    api<ProgressOverview>("/progress/overview", { token })
      .then((data) => {
        setOverview(data);
        if (data.subjects?.length) setActiveSubject(data.subjects[0].id);
      })
      .catch(console.error);
    api<StudyHourPoint[]>("/progress/study-hours?days=7", { token })
      .then(setStudyHours)
      .catch(console.error);
    api<ChatStats>("/progress/chat-stats?weeks=4", { token })
      .then(setChatStats)
      .catch(console.error);
  }, [token]);

  const studyH = overview?.studyTimeMin ? Math.floor(overview.studyTimeMin / 60) : 0;
  const studyM = overview?.studyTimeMin ? overview.studyTimeMin % 60 : 0;
  // Render 7 days from API (YYYY-MM-DD, UTC) — label with local weekday
  const weekData = studyHours.map((p) => {
    const d = new Date(p.date + "T00:00:00");
    return { label: DAY_LABELS[d.getDay()], minutes: p.minutes };
  });
  const weeklyMins = weekData.map((d) => d.minutes);
  const maxMins = Math.max(...weeklyMins, 60);
  const currentSubject = overview?.subjects?.find((s) => s.id === activeSubject);
  const weakTopics = currentSubject?.topics?.filter((t) => t.mastery < 0.6) || [];
  const masteredTopics = (overview?.subjects ?? [])
    .flatMap((s) => s.topics ?? [])
    .filter((t) => t.mastery >= 0.6)
    .map((t) => t.topicName)
    .slice(0, 20);

  return (
    <AppShell maxWidth="max-w-3xl">
      <PageHeader title="Progress" subtitle="Track your learning journey" />

      {/* Study time chart */}
      <section className="card mb-6">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
        >
          Study Time This Week
        </p>
        <div className="flex items-end gap-2 h-28">
          {weekData.length === 0
            ? DAY_LABELS.slice(1).concat("Sun").map((day) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded" style={{ height: "4%", background: "var(--color-border-subtle)", opacity: 0.5 }} />
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{day}</span>
                </div>
              ))
            : weekData.map(({ label, minutes }, i) => {
                const pctH = (minutes / maxMins) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded transition-all duration-700"
                      style={{
                        height: `${Math.max(pctH, 4)}%`,
                        background: minutes > 0 ? "var(--color-accent)" : "var(--color-border-subtle)",
                        opacity: minutes > 0 ? 1 : 0.5,
                        borderRadius: "var(--radius-sm)",
                      }}
                      title={`${minutes} min`}
                    />
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
                  </div>
                );
              })}
        </div>
        <p className="text-sm mt-3" style={{ color: "var(--color-text-secondary)" }}>
          Total:{" "}
          <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {studyH}h {studyM}min
          </span>
        </p>
      </section>

      {/* Chat category breakdown */}
      {chatStats && chatStats.totals.totalMsg > 0 && (
        <section className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
            >
              Chat Breakdown
            </p>
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
              <MessageCircle size={12} /> {chatStats.totals.totalMsg} messages
            </span>
          </div>

          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-4" style={{ background: "var(--color-border-subtle)" }}>
            {CATEGORY_META.map((c) => {
              const pct = chatStats.ratios[c.key] * 100;
              if (pct <= 0) return null;
              return (
                <div
                  key={c.key}
                  style={{ width: `${pct}%`, background: c.color }}
                  title={`${c.label} · ${pct.toFixed(0)}%`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CATEGORY_META.map((c) => {
              const count = chatStats.totals[c.key];
              const pct = Math.round(chatStats.ratios[c.key] * 100);
              return (
                <div key={c.key} className="flex items-start gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-sm flex-shrink-0 mt-1"
                    style={{ background: c.color }}
                  />
                  <div>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.label}</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {pct}% <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>({count})</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {overview && overview.subjects?.length === 0 && (
        <EmptyState
          title="No progress yet"
          description="Enrol in subjects during onboarding and start studying to track your progress here."
          action={<Link href="/onboarding" className="btn-primary text-sm">Start onboarding</Link>}
        />
      )}

      {/* Subject tabs */}
      {overview?.subjects && overview.subjects.length > 0 && (
        <>
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-5 px-5 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide">
            {overview.subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSubject(s.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all flex-shrink-0 cursor-pointer"
                style={{
                  background: activeSubject === s.id ? "var(--color-accent-soft)" : "var(--color-surface-2)",
                  borderColor: activeSubject === s.id ? "var(--color-accent)" : "var(--color-border-default)",
                  color: activeSubject === s.id ? "var(--color-accent-text)" : "var(--color-text-secondary)",
                }}
              >
                <BookOpen size={14} /> {s.name}
              </button>
            ))}
          </div>

          {/* Topic mastery list */}
          {currentSubject && (
            <section className="card mb-6">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
              >
                Topic Mastery — {currentSubject.name}
              </p>
              {currentSubject.topics && currentSubject.topics.length > 0 ? (
                <div className="space-y-4">
                  {currentSubject.topics.map((topic) => {
                    const pct = Math.round(topic.mastery * 100);
                    return (
                      <div key={topic.topicName}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <MasteryIndicator pct={pct} />
                            <span className="text-sm">{topic.topicName}</span>
                          </div>
                          <span
                            className="text-sm font-bold mono"
                            style={{
                              color: pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-text-muted)",
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-border-strong)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
                  Start studying {currentSubject.name} to track your progress!
                </p>
              )}
            </section>
          )}
        </>
      )}

      {/* Weak areas */}
      {weakTopics.length > 0 && (
        <section className="mb-6">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
          >
            Areas to Focus On
          </p>
          <div className="space-y-3">
            {weakTopics.slice(0, 3).map((t) => (
              <div
                key={t.topicName}
                className="card flex items-start justify-between gap-4"
                style={{ borderColor: "rgba(184,134,11,0.2)" }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="font-medium text-sm">{t.topicName}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                      {t.questionsAsked} questions asked · {Math.round(t.mastery * 100)}% correct
                    </p>
                  </div>
                </div>
                <button
                  className="text-xs font-medium flex-shrink-0 flex items-center gap-1 cursor-pointer"
                  style={{ color: "var(--color-accent)" }}
                >
                  Study <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mastered topics */}
      {masteredTopics.length > 0 && (
        <section>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
          >
            Mastered Topics
          </p>
          <div className="flex flex-wrap gap-2">
            {masteredTopics.map((term) => (
              <span key={term} className="pill text-sm">
                {term}
              </span>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

export default function ProgressPage() {
  return <ProgressContent />;
}
