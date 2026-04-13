"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Bell, LogOut, Home, MessageSquare, TrendingUp, Settings, Flame, Clock, Zap } from "lucide-react";
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
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatsCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.FC<{ size: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border-subtle)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}18` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{sub}</p>}
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-base)" }}>
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading...</p>
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

  // Most recent subject session (for "continue" banner)
  const lastSubjectSession = sessions.find((s) => s.mode === "SUBJECT" && s.subject);

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--color-base)" }}
    >
      {/* ── Sidebar (desktop) ── */}
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
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? "var(--color-accent-soft)" : "transparent",
                  color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                  borderColor: active ? "var(--color-accent)" : "transparent",
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
            >
              {firstName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name || user.email}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Student</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm w-full px-2 py-1.5 rounded-md transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-danger)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-56 min-h-screen">
        {/* Top bar (mobile) */}
        <header
          className="md:hidden sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b"
          style={{
            background: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(16px)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <span className="text-xl font-bold">
            <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ
          </span>
          <div className="flex items-center gap-2">
            <button style={{ color: "var(--color-text-muted)" }}>
              <Bell size={18} />
            </button>
            <button
              onClick={logout}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
            >
              {firstName[0]}
            </button>
          </div>
        </header>

        <main className="px-5 md:px-8 py-8 pb-24 md:pb-8 max-w-4xl mx-auto">
          {/* ── Greeting ── */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">
              {getTimeGreeting()}, {firstName}. {new Date().getHours() >= 18 ? "🌙" : "☀️"}
            </h1>
            {lastSubjectSession?.subject && (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Your {lastSubjectSession.subject.name} exam is coming up. Keep going!
              </p>
            )}
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <StatsCard
              icon={Flame as React.FC<{ size: number; style?: React.CSSProperties }>}
              label="Streak"
              value={`${overview?.streakDays || 0}`}
              sub="days"
              color="#F59E0B"
            />
            <StatsCard
              icon={Clock as React.FC<{ size: number; style?: React.CSSProperties }>}
              label="Study time"
              value={studyTimeStr}
              sub="this week"
              color="#22D3A3"
            />
            <div
              className="rounded-2xl p-5 border col-span-2 sm:col-span-1 flex items-center justify-between"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
                  Mastery
                </p>
                <p className="text-3xl font-bold" style={{ color: "#818CF8" }}>
                  {totalMastery}%
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {overview?.subjects?.reduce((s, x) => s + x.masteredTopics, 0) || 0} topics
                </p>
              </div>
              {/* Circular progress */}
              <svg width="56" height="56" className="-rotate-90">
                <circle cx="28" cy="28" r="22" stroke="var(--color-surface)" strokeWidth="5" fill="none" />
                <circle
                  cx="28" cy="28" r="22"
                  stroke="var(--color-accent)"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={2 * Math.PI * 22 * (1 - totalMastery / 100)}
                  style={{ transition: "stroke-dashoffset 1s var(--ease-spring)" }}
                />
              </svg>
            </div>
          </div>

          {/* ── Continue banner ── */}
          {lastSubjectSession && (
            <div className="mb-8">
              <h2 className="text-sm font-medium mb-3" style={{ color: "var(--color-text-muted)" }}>
                CONTINUE WHERE YOU LEFT OFF
              </h2>
              <button
                onClick={() => router.push(`/chat/${lastSubjectSession.id}`)}
                className="w-full rounded-2xl p-5 border text-left transition-all duration-200 group"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.08), var(--color-surface))",
                  borderColor: "rgba(99,102,241,0.25)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-glow)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.25)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{lastSubjectSession.subject?.iconEmoji}</span>
                    <div>
                      <p className="font-semibold">{lastSubjectSession.subject?.name}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {lastSubjectSession.title || "Continue learning"}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-sm font-medium transition-transform group-hover:translate-x-1"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Continue →
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* ── Open chat card ── */}
          <button
            onClick={() => startChat()}
            disabled={creating === "open"}
            className="w-full rounded-2xl p-5 mb-8 border text-left transition-all duration-200 group flex items-center gap-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(129,140,248,0.04) 100%)",
              borderColor: "var(--color-border-subtle)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: "var(--color-accent-soft)" }}
            >
              💬
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Chat với Linh</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Nói chuyện tự do — học tập, cuộc sống, bất cứ điều gì...
              </p>
            </div>
            <Zap size={18} style={{ color: "var(--color-accent)", opacity: 0.5 }} />
          </button>

          {/* ── Subjects grid ── */}
          <div className="mb-8">
            <h2 className="text-sm font-medium mb-4" style={{ color: "var(--color-text-muted)" }}>
              YOUR SUBJECTS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview?.subjects?.map((subject) => {
                const pct = Math.round((subject.overallMastery || 0) * 100);
                return (
                  <button
                    key={subject.id}
                    onClick={() => startChat(subject.id)}
                    disabled={creating === subject.id}
                    className="rounded-2xl p-5 border text-left transition-all duration-200 group relative overflow-hidden"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border-subtle)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(99,102,241,0.4)";
                      el.style.boxShadow = "var(--shadow-glow)";
                      el.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "var(--color-border-subtle)";
                      el.style.boxShadow = "none";
                      el.style.transform = "translateY(0)";
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">{subject.iconEmoji}</span>
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          background: "var(--color-elevated)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {subject.curriculum}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{subject.name}</h3>
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--color-text-muted)", minHeight: 40 }}>
                      {subject.description}
                    </p>
                    <div className="progress-bar mb-2">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {subject.masteredTopics}/{subject.totalTopics} topics
                      </span>
                      <span className="text-sm font-bold" style={{ color: "var(--color-accent)" }}>
                        {pct}%
                      </span>
                    </div>
                    {/* hover CTA */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "linear-gradient(90deg, transparent, var(--color-accent), transparent)" }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Recent sessions ── */}
          {sessions.length > 0 && (
            <div>
              <h2 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-success)" }} />
                RECENT SESSIONS
              </h2>
              <div className="space-y-2">
                {sessions.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/chat/${s.id}`)}
                    className="w-full rounded-xl px-4 py-4 border text-left flex items-center gap-4 transition-all duration-150 group"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border-subtle)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
                      (e.currentTarget as HTMLElement).style.background = "var(--color-surface)";
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg border"
                      style={{
                        background: "var(--color-elevated)",
                        borderColor: "var(--color-border-subtle)",
                      }}
                    >
                      {s.subject?.iconEmoji || "💬"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {s.title || (s.subject ? s.subject.name : "Open Chat")}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                        {s.messages[0]?.content || "Started a new session"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(s.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                      <span
                        className="text-sm opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 -translate-x-1 inline-block"
                        style={{ color: "var(--color-accent)" }}
                      >
                        →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Bottom Nav (mobile) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around h-16 border-t"
        style={{
          background: "rgba(8,12,20,0.9)",
          backdropFilter: "blur(16px)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-4 py-2"
              style={{ color: active ? "var(--color-accent)" : "var(--color-text-muted)" }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
