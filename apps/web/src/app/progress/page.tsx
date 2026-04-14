"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Home, MessageSquare, TrendingUp, Settings, ChevronRight, AlertTriangle } from "lucide-react";

interface TopicMastery {
  topicName: string;
  mastery: number; // 0.0–1.0
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Mock weekly distribution since API doesn't have daily breakdown yet
function mockWeekly(total: number) {
  const base = [0.15, 0.05, 0.2, 0.12, 0.2, 0.03, 0.12].map((r) => Math.round(r * total));
  return base;
}

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageSquare, label: "Chat với Linh" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function MasteryBadge({ pct }: { pct: number }) {
  if (pct >= 80) return <span style={{ color: "var(--color-success)" }}>✅</span>;
  if (pct >= 50) return <span>⚠️</span>;
  return <span style={{ color: "var(--color-text-muted)" }}>──</span>;
}

function ProgressContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading } = useAuth();
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [activeSubject, setActiveSubject] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    api<ProgressOverview>("/progress/overview", { token })
      .then((data) => {
        setOverview(data);
        if (data.subjects?.length) setActiveSubject(data.subjects[0].id);
      })
      .catch(console.error);
  }, [token]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-base)" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const studyH = overview?.studyTimeMin ? Math.floor(overview.studyTimeMin / 60) : 0;
  const studyM = overview?.studyTimeMin ? overview.studyTimeMin % 60 : 0;
  const weeklyMins = mockWeekly(overview?.studyTimeMin || 0);
  const maxMins = Math.max(...weeklyMins, 60);
  const currentSubject = overview?.subjects?.find((s) => s.id === activeSubject);

  // Weak areas: topics below 60%
  const weakTopics = currentSubject?.topics?.filter((t) => t.mastery < 0.6) || [];

  // Key terms earned (mock — would come from API)
  const KEY_TERMS = ["osmosis", "semi-permeable", "concentration gradient", "chlorophyll", "photosynthesis", "active transport"];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-base)" }}>
      {/* ── Sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-56 border-r fixed inset-y-0 left-0 z-20"
        style={{ background: "var(--color-void)", borderColor: "var(--color-border-subtle)" }}
      >
        <div className="px-5 py-6 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <span className="text-xl font-bold">
            <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: active ? "var(--color-accent-soft)" : "transparent", color: active ? "var(--color-accent)" : "var(--color-text-secondary)" }}>
                <Icon size={18} />{label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 md:ml-56">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b"
          style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(16px)", borderColor: "var(--color-border-subtle)" }}>
          <h1 className="text-lg font-bold">Progress</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium px-3 py-1.5 rounded-full"
              style={{ background: "var(--color-accent-soft)", color: "var(--color-text-hint)" }}>
              This week ▾
            </span>
          </div>
        </header>

        <main className="px-5 md:px-8 py-8 pb-24 md:pb-8 max-w-3xl mx-auto">
          <div className="hidden md:flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Progress</h1>
            <span className="text-sm font-medium px-3 py-1.5 rounded-full border"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
              This week ▾
            </span>
          </div>

          {/* ── Study time chart ── */}
          <section className="rounded-2xl border p-5 mb-6"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}>
            <h2 className="text-sm font-medium mb-4" style={{ color: "var(--color-text-muted)" }}>
              STUDY TIME THIS WEEK
            </h2>
            <div className="flex items-end gap-2 h-28">
              {DAYS.map((day, i) => {
                const mins = weeklyMins[i];
                const pctH = (mins / maxMins) * 100;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-md transition-all duration-700"
                      style={{
                        height: `${Math.max(pctH, 4)}%`,
                        background: mins > 0 ? "linear-gradient(to top, var(--color-accent), #818CF8)" : "var(--color-elevated)",
                        opacity: mins > 0 ? 1 : 0.5,
                      }}
                    />
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{day}</span>
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

          {/* ── Subject tabs ── */}
          {overview?.subjects && overview.subjects.length > 0 && (
            <>
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-5 px-5 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide">
                {overview.subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSubject(s.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all flex-shrink-0"
                    style={{
                      background: activeSubject === s.id ? "var(--color-accent-soft)" : "var(--color-surface)",
                      borderColor: activeSubject === s.id ? "var(--color-accent)" : "var(--color-border-subtle)",
                      color: activeSubject === s.id ? "var(--color-accent)" : "var(--color-text-secondary)",
                    }}
                  >
                    {s.iconEmoji} {s.name}
                  </button>
                ))}
              </div>

              {/* Topic mastery list */}
              {currentSubject && (
                <section className="rounded-2xl border p-5 mb-6"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}>
                  <h2 className="text-sm font-medium mb-4" style={{ color: "var(--color-text-muted)" }}>
                    TOPIC MASTERY — {currentSubject.name.toUpperCase()}
                  </h2>
                  {currentSubject.topics && currentSubject.topics.length > 0 ? (
                    <div className="space-y-4">
                      {currentSubject.topics.map((topic) => {
                        const pct = Math.round(topic.mastery * 100);
                        return (
                          <div key={topic.topicName}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <MasteryBadge pct={pct} />
                                <span className="text-sm">{topic.topicName}</span>
                              </div>
                              <span className="text-sm font-bold mono" style={{ color: pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-text-muted)" }}>
                                {pct}%
                              </span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: pct >= 80
                                    ? "linear-gradient(90deg, var(--color-success), #34d399)"
                                    : pct >= 50
                                      ? "linear-gradient(90deg, var(--color-warning), #fbbf24)"
                                      : "linear-gradient(90deg, var(--color-text-muted), var(--color-border-default))",
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

          {/* ── Weak areas ── */}
          {weakTopics.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-medium mb-3" style={{ color: "var(--color-text-muted)" }}>
                WEAK AREAS TO FOCUS ON
              </h2>
              <div className="space-y-3">
                {weakTopics.slice(0, 3).map((t) => (
                  <div
                    key={t.topicName}
                    className="rounded-xl p-4 border flex items-start justify-between gap-4"
                    style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)" }}
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
                      className="text-xs font-medium flex-shrink-0 flex items-center gap-1"
                      style={{ color: "var(--color-accent)" }}
                    >
                      Study <ChevronRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Key terms earned ── */}
          <section>
            <h2 className="text-sm font-medium mb-3" style={{ color: "var(--color-text-muted)" }}>
              KEY TERMS EARNED THIS WEEK
            </h2>
            <div className="flex flex-wrap gap-2">
              {KEY_TERMS.map((term) => (
                <span key={term} className="key-term text-sm">
                  {term}
                </span>
              ))}
              <span className="tag text-sm">+14 more</span>
            </div>
          </section>
        </main>
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around h-16 border-t"
        style={{ background: "rgba(8,12,20,0.9)", backdropFilter: "blur(16px)", borderColor: "var(--color-border-subtle)" }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-4 py-2"
              style={{ color: active ? "var(--color-accent)" : "var(--color-text-muted)" }}>
              <Icon size={20} /><span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <AuthProvider>
      <ProgressContent />
    </AuthProvider>
  );
}
