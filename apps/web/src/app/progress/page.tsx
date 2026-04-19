"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Home, MessageSquare, TrendingUp, Settings, Compass, Trophy } from "lucide-react";

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

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
function mockWeekly(total: number) {
  return [0.15, 0.05, 0.2, 0.12, 0.2, 0.03, 0.12].map((r) => Math.round(r * total));
}

const NAV_ITEMS = [
  { href: "/dashboard",   icon: Home,          label: "Dashboard" },
  { href: "/explore",     icon: Compass,       label: "Explore" },
  { href: "/chat",        icon: MessageSquare, label: "Chat + Book" },
  { href: "/progress",    icon: TrendingUp,    label: "Progress" },
  { href: "/leaderboard", icon: Trophy,        label: "Leaderboard" },
  { href: "/settings",    icon: Settings,      label: "Settings" },
];

const KEY_TERMS = [
  "osmosis", "semi-permeable membrane", "concentration gradient",
  "chlorophyll", "photosynthesis", "active transport",
  "double circulatory system", "atria", "ventricles", "atrioventricular valves",
];

function Pbar({ pct, color = "var(--color-accent)", h = 4 }: { pct: number; color?: string; h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 999, background: "var(--color-border-default)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, color: "var(--color-void)",
      }}>L</div>
      <span style={{ fontSize: 17, fontWeight: 800 }}>
        Linh<span style={{ color: "var(--color-accent)" }}>IQ</span>
      </span>
    </div>
  );
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-base)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--color-accent)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const studyH = overview?.studyTimeMin ? Math.floor(overview.studyTimeMin / 60) : 0;
  const studyM = overview?.studyTimeMin ? overview.studyTimeMin % 60 : 0;
  const weeklyMins = mockWeekly(overview?.studyTimeMin || 0);
  const maxMins = Math.max(...weeklyMins, 60);
  const currentSubject = overview?.subjects?.find((s) => s.id === activeSubject);
  const weakTopics = currentSubject?.topics?.filter((t) => t.mastery < 0.6) || [];

  const totalMastery = (() => {
    const total = overview?.subjects?.reduce((s, x) => s + (x.topics?.length || 0), 0) || 0;
    const mastered = overview?.subjects?.reduce((s, x) => s + (x.topics?.filter(t => t.mastery >= 0.8).length || 0), 0) || 0;
    return total > 0 ? Math.round((mastered / total) * 100) : 0;
  })();

  const masteryColor = (pct: number) =>
    pct >= 70 ? "var(--color-teal)" : pct >= 40 ? "var(--color-accent)" : pct > 0 ? "var(--color-gold)" : "var(--color-border-default)";

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--color-base)" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, borderRight: "1px solid var(--color-border-subtle)",
        background: "var(--color-void)", display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
      }}
        className="hidden md:flex"
      >
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--color-border-subtle)" }}>
          <Logo />
        </div>
        <nav style={{ padding: 10, flex: 1 }}>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: "var(--radius-md)", marginBottom: 2,
                background: active ? "var(--color-accent-soft)" : "transparent",
                color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                fontSize: 13, fontWeight: active ? 600 : 500,
                border: active ? "1px solid var(--color-accent-border)" : "1px solid transparent",
                transition: "all 120ms", textDecoration: "none",
              }}>
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile header */}
        <header className="md:hidden" style={{
          position: "sticky", top: 0, zIndex: 10, padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(13,16,12,0.9)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Progress</h1>
        </header>

        <main style={{ padding: "32px 40px", overflowY: "auto", paddingBottom: 80 }} className="px-5 md:px-10">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Progress</h1>
            <div style={{
              display: "flex", background: "var(--color-surface)", padding: 4,
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-subtle)", gap: 2,
            }}>
              {["This week", "This month"].map((t, i) => (
                <button key={t} style={{
                  padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "none",
                  background: i === 0 ? "var(--color-elevated)" : "transparent",
                  color: i === 0 ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}
            className="grid-cols-1 md:grid-cols-2"
          >
            {/* Study time chart */}
            <div style={{ padding: "22px", borderRadius: "var(--radius-xl)", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>Study time</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: "var(--color-teal)" }}>
                    {studyH}h {studyM}min
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>this week</p>
                </div>
                <div style={{
                  padding: "4px 12px", height: "fit-content", borderRadius: 999,
                  background: "rgba(61,214,140,0.12)", border: "1px solid rgba(61,214,140,0.25)",
                  fontSize: 12, fontWeight: 700, color: "var(--color-teal)",
                }}>🔥 {overview?.streakDays || 0}-day streak</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 72 }}>
                {DAYS.map((d, i) => {
                  const mins = weeklyMins[i];
                  const pctH = (mins / maxMins) * 100;
                  return (
                    <div key={`${d}-${i}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                        <div style={{
                          width: "100%", minHeight: 3, borderRadius: "3px 3px 0 0",
                          height: `${Math.max(pctH, 4)}%`,
                          background: mins === 0 ? "var(--color-border-default)" : "linear-gradient(180deg, var(--color-teal) 0%, rgba(61,214,140,0.4) 100%)",
                          transition: "height 0.8s cubic-bezier(0.16,1,0.3,1)",
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: mins > 0 ? "var(--color-text-secondary)" : "var(--color-text-muted)", fontWeight: 600 }}>{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Questions answered", value: String((currentSubject?.topics || []).reduce((s, t) => s + t.questionsAsked, 0) || 47), color: "var(--color-accent)" },
                { label: "Overall mastery",     value: `${totalMastery}%`,                                                                      color: "var(--color-teal)" },
                { label: "Key terms earned",    value: String(KEY_TERMS.length),                                                                color: "var(--color-gold)" },
                { label: "Subjects studying",   value: String(overview?.subjects?.length || 0),                                                color: "var(--color-accent)" },
              ].map((s) => (
                <div key={s.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderRadius: "var(--radius-md)",
                  background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)",
                }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{s.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject tabs */}
          {overview?.subjects && overview.subjects.length > 0 && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }} className="overflow-x-auto scrollbar-hide">
                {overview.subjects.map((s) => (
                  <button key={s.id} onClick={() => setActiveSubject(s.id)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                    borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", flexShrink: 0,
                    background: activeSubject === s.id ? "var(--color-accent)" : "var(--color-surface)",
                    color: activeSubject === s.id ? "var(--color-void)" : "var(--color-text-secondary)",
                    fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                    border: activeSubject === s.id ? "none" : "1px solid var(--color-border-subtle)",
                    transition: "all 150ms",
                  }}>
                    {s.iconEmoji} {s.name}
                  </button>
                ))}
              </div>

              {/* Topic mastery */}
              {currentSubject && (
                <div style={{ padding: "24px", borderRadius: "var(--radius-xl)", marginBottom: 20, background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 20 }}>
                    Topic mastery — {currentSubject.name}
                  </p>
                  {currentSubject.topics && currentSubject.topics.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {currentSubject.topics.map((topic) => {
                        const pct = Math.round(topic.mastery * 100);
                        const col = masteryColor(pct);
                        return (
                          <div key={topic.topicName}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: col, display: "inline-block", flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: pct === 0 ? "var(--color-text-muted)" : "var(--color-text-primary)", fontWeight: pct >= 70 ? 600 : 400 }}>
                                  {topic.topicName}
                                </span>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: col, minWidth: 32, textAlign: "right" }}>
                                {pct > 0 ? `${pct}%` : "—"}
                              </span>
                            </div>
                            <Pbar pct={pct} color={col} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 14, color: "var(--color-text-muted)", textAlign: "center", padding: "20px 0" }}>
                      Start studying {currentSubject.name} to track your progress!
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Weak areas */}
          {weakTopics.length > 0 && (
            <div style={{
              padding: "18px 20px", borderRadius: "var(--radius-lg)", marginBottom: 20,
              background: "rgba(232,168,56,0.08)", border: "1px solid rgba(232,168,56,0.25)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, marginBottom: 3 }}>{weakTopics[0].topicName} cần ôn thêm</p>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  {Math.round(weakTopics[0].mastery * 100)}% sau {weakTopics[0].questionsAsked} câu hỏi. Drill thêm để cải thiện mastery.
                </p>
              </div>
              <Link href="/chat" style={{
                padding: "8px 16px", borderRadius: "var(--radius-md)", background: "var(--color-gold)",
                border: "none", color: "var(--color-void)", fontWeight: 700, fontSize: 13, flexShrink: 0,
                textDecoration: "none",
              }}>Study now →</Link>
            </div>
          )}

          {/* Key terms */}
          <div style={{ padding: "22px", borderRadius: "var(--radius-xl)", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 14 }}>Key terms earned this week</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {KEY_TERMS.map((t) => (
                <span key={t} style={{
                  padding: "4px 12px", borderRadius: 999,
                  background: "rgba(61,214,140,0.1)", border: "1px solid rgba(61,214,140,0.22)",
                  fontSize: 12, fontWeight: 600, color: "var(--color-teal)",
                }}>{t}</span>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-around", height: 64,
        background: "rgba(13,16,12,0.95)", backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--color-border-subtle)",
      }}>
        {[
          { href: "/dashboard", icon: Home, label: "Home" },
          { href: "/explore",   icon: Compass, label: "Explore" },
          { href: "/chat",      icon: MessageSquare, label: "Chat" },
          { href: "/progress",  icon: TrendingUp, label: "Progress" },
          { href: "/leaderboard", icon: Trophy, label: "Ranks" },
        ].map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 12px",
              color: active ? "var(--color-accent)" : "var(--color-text-muted)", textDecoration: "none",
            }}>
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function ProgressPage() {
  return <ProgressContent />;
}
