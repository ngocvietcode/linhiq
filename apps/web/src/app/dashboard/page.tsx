"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Bell, LogOut, Home, MessageSquare, TrendingUp, Settings,
  Flame, Clock, Sparkles, Compass, Trophy, Target, Zap,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface SubjectProgress {
  id: string;
  name: string;
  curriculum: string;
  iconEmoji: string;
  description: string | null;
  totalTopics: number;
  masteredTopics: number;
  overallMastery: number;
}

interface ProgressOverview {
  streakDays: number;
  studyTimeMin: number;
  subjects: SubjectProgress[];
}

interface SessionPreview {
  id: string;
  title: string | null;
  updatedAt: string;
  mode: "SUBJECT" | "OPEN";
  subject: { id: string; iconEmoji: string; name: string } | null;
  messages: { content: string }[];
}

const NAV_ITEMS = [
  { href: "/dashboard",    icon: Home,          label: "Dashboard" },
  { href: "/explore",      icon: Compass,       label: "Explore" },
  { href: "/chat",         icon: MessageSquare, label: "Chat + Book" },
  { href: "/progress",     icon: TrendingUp,    label: "Progress" },
  { href: "/leaderboard",  icon: Trophy,        label: "Leaderboard" },
  { href: "/settings",     icon: Settings,      label: "Settings" },
];

const MOBILE_NAV = [
  { href: "/dashboard",   icon: Home,          label: "Home" },
  { href: "/explore",     icon: Compass,       label: "Explore" },
  { href: "/chat",        icon: MessageSquare, label: "Chat" },
  { href: "/progress",    icon: TrendingUp,    label: "Progress" },
  { href: "/leaderboard", icon: Trophy,        label: "Ranks" },
];

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, color: "var(--color-void)",
        boxShadow: "0 2px 12px var(--color-accent-glow)",
      }}>L</div>
      <span style={{ fontSize: 17, fontWeight: 800, color: "var(--color-text-primary)" }}>
        Linh<span style={{ color: "var(--color-accent)" }}>IQ</span>
      </span>
    </div>
  );
}

function Pbar({ pct, color = "var(--color-accent)", h = 5 }: { pct: number; color?: string; h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 999, background: "var(--color-border-default)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading, logout } = useAuth();
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [sessions, setSessions] = useState<SessionPreview[]>([]);
  const [creating, setCreating] = useState<string | null>(null);
  const [goalDone, setGoalDone] = useState(3);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    api<ProgressOverview>("/progress/overview", { token }).then(setOverview).catch(console.error);
    api<SessionPreview[]>("/chat/sessions", { token }).then(setSessions).catch(console.error);
  }, [token]);

  async function startChat(subjectId?: string) {
    if (!token || creating) return;
    setCreating(subjectId || "open");
    try {
      const body = subjectId && subjectId !== "undefined" ? { subjectId } : {};
      const session = await api<{ id: string }>("/chat/sessions", { method: "POST", body, token });
      router.push(`/chat/${session.id}`);
    } catch (err) {
      console.error(err);
      setCreating(null);
    }
  }

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-base)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--color-accent)", borderTopColor: "transparent", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "Student";
  const studyH = overview?.studyTimeMin ? Math.floor(overview.studyTimeMin / 60) : 0;
  const studyM = overview?.studyTimeMin ? overview.studyTimeMin % 60 : 0;
  const studyTimeStr = studyH > 0 ? `${studyH}h ${studyM}m` : `${studyM}m`;
  const totalMastery = (() => {
    const total = overview?.subjects?.reduce((s, x) => s + x.totalTopics, 0) || 0;
    const mastered = overview?.subjects?.reduce((s, x) => s + x.masteredTopics, 0) || 0;
    return total > 0 ? Math.round((mastered / total) * 100) : 0;
  })();
  const lastSubjectSession = sessions.find((s) => s.mode === "SUBJECT" && s.subject);

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--color-base)" }}>

      {/* ── Sidebar (desktop) ── */}
      <aside style={{
        width: 220, flexShrink: 0, borderRight: "1px solid var(--color-border-subtle)",
        background: "var(--color-void)", display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
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
                borderRadius: "var(--radius-md)", marginBottom: 2, cursor: "pointer",
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
        {/* Today's goal mini */}
        <div style={{ padding: "12px 12px 4px", borderTop: "1px solid var(--color-border-subtle)" }}>
          <div style={{
            padding: "10px 12px", borderRadius: "var(--radius-md)", marginBottom: 10,
            background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)" }}>Today's goal</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-accent)" }}>{goalDone}/5 sessions</span>
            </div>
            <Pbar pct={(goalDone / 5) * 100} />
          </div>
        </div>
        {/* User */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "var(--color-void)",
            }}>{firstName[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{user.name || user.email}</p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Student</p>
            </div>
            <button onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-danger)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile top bar */}
        <header className="md:hidden" style={{
          position: "sticky", top: 0, zIndex: 10,
          padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(13,16,12,0.9)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
              <Bell size={18} />
            </button>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "var(--color-void)",
            }}>{firstName[0]}</div>
          </div>
        </header>

        <main style={{ padding: "32px 40px", overflowY: "auto", maxWidth: 880, paddingBottom: "80px" }}
          className="px-5 md:px-10"
        >
          {/* Greeting */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
                {getTimeGreeting()}, {firstName}. {new Date().getHours() >= 18 ? "🌙" : "☀️"}
              </h1>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
                {lastSubjectSession?.subject
                  ? <>{lastSubjectSession.subject.name} exam coming up. <strong style={{ color: "var(--color-gold)" }}>Stay consistent.</strong></>
                  : "What would you like to study today?"}
              </p>
            </div>
            <button style={{ padding: 8, borderRadius: "var(--radius-md)", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)", cursor: "pointer" }}>
              <Bell size={16} color="var(--color-text-muted)" />
            </button>
          </div>

          {/* Today's goal tracker */}
          <div style={{
            padding: "22px 24px", borderRadius: "var(--radius-xl)", marginBottom: 24,
            background: "linear-gradient(135deg, var(--color-accent-soft), rgba(93,184,112,0.04))",
            border: "1px solid var(--color-accent-border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: "var(--color-accent-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Target size={18} color="var(--color-accent)" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 2, fontSize: 14 }}>Today's goal</p>
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>5 study sessions · 2h minimum</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "var(--color-accent)", lineHeight: 1 }}>
                  {goalDone}<span style={{ fontSize: 16, color: "var(--color-text-muted)" }}>/5</span>
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>sessions</p>
              </div>
            </div>
            <Pbar pct={(goalDone / 5) * 100} h={6} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} onClick={() => setGoalDone(n)} style={{
                  flex: 1, height: 28, borderRadius: 6, cursor: "pointer",
                  background: n <= goalDone ? "var(--color-accent)" : "var(--color-surface)",
                  border: `1px solid ${n <= goalDone ? "transparent" : "var(--color-border-default)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: n <= goalDone ? "var(--color-void)" : "var(--color-text-muted)",
                  transition: "all 150ms",
                }}>{n <= goalDone ? "✓" : n}</div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}
            className="grid-cols-2 sm:grid-cols-3"
          >
            {[
              { icon: Flame,    label: "Streak",     value: `${overview?.streakDays || 0}`, unit: "days",       color: "var(--color-gold)" },
              { icon: Clock,    label: "Study time",  value: studyTimeStr,                   unit: "this week",  color: "var(--color-teal)" },
              { icon: Sparkles, label: "Mastery",     value: `${totalMastery}%`,             unit: "overall",    color: "var(--color-accent)" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{
                  padding: "18px", borderRadius: "var(--radius-lg)",
                  background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, marginBottom: 12,
                    background: `color-mix(in srgb, ${s.color} 15%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={16} color={s.color} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 3 }}>{s.unit}</p>
                </div>
              );
            })}
          </div>

          {/* AI Recommendation */}
          {lastSubjectSession && (
            <div style={{
              padding: "16px 20px", borderRadius: "var(--radius-lg)", marginBottom: 24,
              background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)",
              display: "flex", gap: 14, alignItems: "center",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-bright))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: "var(--color-void)",
              }}>L</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent)", marginBottom: 3 }}>AI RECOMMENDATION</p>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  Continue {lastSubjectSession.subject?.name}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  {lastSubjectSession.title || "Pick up where you left off — stay consistent."}
                </p>
              </div>
              <button onClick={() => router.push(`/chat/${lastSubjectSession.id}`)} style={{
                padding: "8px 16px", borderRadius: "var(--radius-md)", background: "var(--color-accent)",
                border: "none", color: "var(--color-void)", fontSize: 13, fontWeight: 700,
                cursor: "pointer", flexShrink: 0, fontFamily: "inherit",
              }}>Study →</button>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}
            className="grid-cols-1 sm:grid-cols-2"
          >
            {[
              { icon: MessageSquare, label: "Chat với Linh",   sub: "Free chat — học hoặc chuyện trò",  href: "/chat",        color: "var(--color-accent)" },
              { icon: Zap,           label: "Practice Mode",   sub: "Luyện đề IGCSE — chuẩn Mark Scheme", href: "/quiz",       color: "var(--color-gold)" },
              { icon: Compass,       label: "Explore Topics",  sub: "Browse toàn bộ curriculum",           href: "/explore",    color: "#E06848" },
              { icon: Trophy,        label: "Leaderboard",     sub: "Xem bảng xếp hạng bạn bè",           href: "/leaderboard",color: "var(--color-teal)" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} href={a.href} style={{
                  padding: "16px", borderRadius: "var(--radius-lg)",
                  background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)",
                  cursor: "pointer", transition: "all 180ms", display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent-border)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
                    (e.currentTarget as HTMLElement).style.transform = "none";
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: `color-mix(in srgb, ${a.color} 12%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={18} color={a.color} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: "var(--color-text-primary)" }}>{a.label}</p>
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{a.sub}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Subjects */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>YOUR SUBJECTS</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginBottom: 28 }}>
            {overview?.subjects?.map((subject) => {
              const pct = Math.round((subject.overallMastery || 0) * 100);
              const subjectColor = pct >= 70 ? "var(--color-teal)" : pct >= 40 ? "var(--color-accent)" : "var(--color-gold)";
              return (
                <button key={subject.id} onClick={() => startChat(subject.id)} disabled={creating === subject.id} style={{
                  padding: "20px", borderRadius: "var(--radius-lg)",
                  background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)",
                  cursor: "pointer", transition: "all 200ms", textAlign: "left",
                }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--color-accent-border)";
                    el.style.transform = "translateY(-2px)";
                    el.style.boxShadow = "0 8px 24px var(--color-accent-glow)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--color-border-subtle)";
                    el.style.transform = "none";
                    el.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 28 }}>{subject.iconEmoji}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                      background: "var(--color-elevated)", color: "var(--color-text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>{subject.curriculum}</span>
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, color: "var(--color-text-primary)" }}>{subject.name}</h3>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 16, lineHeight: 1.5 }}>{subject.description}</p>
                  <Pbar pct={pct} color={subjectColor} h={4} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{subject.masteredTopics}/{subject.totalTopics} topics</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: subjectColor }}>{pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Recent sessions */}
          {sessions.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
                RECENT SESSIONS
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sessions.slice(0, 4).map((s) => (
                  <button key={s.id} onClick={() => router.push(`/chat/${s.id}`)} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                    borderRadius: "var(--radius-lg)", background: "var(--color-surface)",
                    border: "1px solid var(--color-border-subtle)", cursor: "pointer", textAlign: "left", transition: "all 150ms",
                  }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent-border)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(93,184,112,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
                      (e.currentTarget as HTMLElement).style.background = "var(--color-surface)";
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: "var(--color-elevated)", border: "1px solid var(--color-border-subtle)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>{s.subject?.iconEmoji || "💬"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)", marginBottom: 2 }}>
                        {s.title || (s.subject ? s.subject.name : "Open Chat")}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)" }} className="truncate">
                        {s.messages[0]?.content || "Started a new session"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                        {new Date(s.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                      <span style={{ fontSize: 14, color: "var(--color-accent)" }}>→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-around", height: 64,
        background: "rgba(13,16,12,0.95)", backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--color-border-subtle)",
      }}>
        {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
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

export default function DashboardPage() {
  return <DashboardContent />;
}
