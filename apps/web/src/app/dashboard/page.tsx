"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Flame, Clock, TrendingUp, Zap, BookOpen,
  MessageSquare, ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";

/* ── Types ── */
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

/* ── Helpers ── */
function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getSubjectIcon(name: string) {
  const map: Record<string, React.FC<{ size: number; className?: string }>> = {
    Biology: () => <BookOpen size={18} />,
    Chemistry: () => <BookOpen size={18} />,
    Physics: () => <BookOpen size={18} />,
    Mathematics: () => <TrendingUp size={18} />,
  };
  const Icon = map[name];
  return Icon ? <Icon size={18} /> : <BookOpen size={18} />;
}

/* ── Stat Card ── */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.FC<{ size: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card card--flat">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
        style={{ background: "var(--color-accent-soft)" }}
      >
        <Icon size={16} style={{ color: "var(--color-accent)" }} />
      </div>
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-1"
        style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
      >
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: "var(--color-text-heading)" }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── Main Dashboard ── */
function DashboardContent() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [sessions, setSessions] = useState<SessionPreview[]>([]);
  const [creating, setCreating] = useState<string | null>(null);

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

  const firstName = user?.name?.split(" ")[0] || "Student";
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
    <AppShell>
      {/* Greeting */}
      <PageHeader
        title={`${getTimeGreeting()}, ${firstName}.`}
        subtitle={
          lastSubjectSession?.subject
            ? `Your ${lastSubjectSession.subject.name} studies are in progress.`
            : "Ready to learn something new today?"
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Flame as React.FC<{ size: number; style?: React.CSSProperties }>}
          label="Streak"
          value={`${overview?.streakDays || 0}`}
          sub="days"
        />
        <StatCard
          icon={Clock as React.FC<{ size: number; style?: React.CSSProperties }>}
          label="Study time"
          value={studyTimeStr}
          sub="this week"
        />
        <div className="card card--flat col-span-2 sm:col-span-1 flex items-center justify-between">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
            >
              Mastery
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--color-text-heading)" }}>
              {totalMastery}%
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {overview?.subjects?.reduce((s, x) => s + x.masteredTopics, 0) || 0} topics
            </p>
          </div>
          {/* Circular progress */}
          <svg width="52" height="52" className="-rotate-90">
            <circle cx="26" cy="26" r="20" stroke="var(--color-border-subtle)" strokeWidth="4" fill="none" />
            <circle
              cx="26" cy="26" r="20"
              stroke="var(--color-accent)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - totalMastery / 100)}
              style={{ transition: "stroke-dashoffset 1s var(--ease-out)" }}
            />
          </svg>
        </div>
      </div>

      {/* Continue banner */}
      {lastSubjectSession && (
        <div className="mb-8">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
          >
            Continue where you left off
          </p>
          <button
            onClick={() => router.push(`/chat/${lastSubjectSession.id}`)}
            className="w-full card text-left group flex items-center gap-4 cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "var(--color-accent-soft)" }}
            >
              <BookOpen size={18} style={{ color: "var(--color-accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{lastSubjectSession.subject?.name}</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {lastSubjectSession.title || "Continue learning"}
              </p>
            </div>
            <ChevronRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
              style={{ color: "var(--color-text-muted)" }}
            />
          </button>
        </div>
      )}

      {/* Open chat card */}
      <button
        onClick={() => startChat()}
        disabled={creating === "open"}
        className="w-full card text-left mb-8 flex items-center gap-4 cursor-pointer"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: "var(--color-accent-soft)" }}
        >
          <MessageSquare size={18} style={{ color: "var(--color-accent)" }} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Chat with Linh</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Free conversation — homework, life, anything...
          </p>
        </div>
        <Zap size={16} style={{ color: "var(--color-text-muted)" }} />
      </button>

      {/* Subjects grid */}
      <div className="mb-8">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-4 px-1"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
        >
          Your Subjects
        </p>
        {overview && overview.subjects?.length === 0 && (
          <EmptyState
            title="No subjects yet"
            description="Complete onboarding to enrol in your subjects and start learning."
            action={<Link href="/onboarding" className="btn-primary text-sm">Start onboarding</Link>}
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview?.subjects?.map((subject) => {
            const pct = Math.round((subject.overallMastery || 0) * 100);
            return (
              <div key={subject.id} className="card group">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--color-accent-soft)" }}
                  >
                    {getSubjectIcon(subject.name)}
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{
                      background: "var(--color-surface-0)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {subject.curriculum}
                  </span>
                </div>
                <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  {subject.name}
                </h3>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--color-text-muted)", minHeight: 40 }}>
                  {subject.description}
                </p>
                <div className="progress-bar mb-2">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {subject.masteredTopics}/{subject.totalTopics} topics
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--color-accent)" }}>
                    {pct}%
                  </span>
                </div>
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); startChat(subject.id); }}
                    className="flex-1 py-1.5 text-xs text-center rounded-md cursor-pointer transition-colors"
                    style={{ background: "var(--color-surface-0)", color: "var(--color-text-primary)" }}
                  >
                    Chat
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/reader/${subject.id}`); }}
                    className="flex-1 py-1.5 text-xs text-center rounded-md cursor-pointer transition-colors"
                    style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-text)" }}
                  >
                    Read
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-4 px-1"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
        >
          Recent Sessions
        </p>
        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Start a chat with Linh to begin your first learning session."
            action={
              <button onClick={() => startChat()} className="btn-primary text-sm cursor-pointer">
                Start chatting
              </button>
            }
          />
        ) : (
          <>
            <div className="space-y-2">
              {sessions.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/chat/${s.id}`)}
                  className="w-full card card--flat px-4 py-3 text-left flex items-center gap-4 group cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--color-surface-0)" }}
                  >
                    {s.mode === "SUBJECT" ? (
                      <BookOpen size={16} style={{ color: "var(--color-accent)" }} />
                    ) : (
                      <MessageSquare size={16} style={{ color: "var(--color-text-muted)" }} />
                    )}
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
                    <ChevronRight
                      size={14}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-0.5"
                      style={{ color: "var(--color-accent)" }}
                    />
                  </div>
                </button>
              ))}
            </div>
            {sessions.length > 4 && (
              <div className="mt-3 text-center">
                <Link href="/chat" className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
                  View all sessions →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
