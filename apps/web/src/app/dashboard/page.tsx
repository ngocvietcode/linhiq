"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Flame, Clock, TrendingUp, Zap, BookOpen,
  MessageSquare, ChevronRight, Target, Pencil,
  Check, X,
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

interface StudyHourPoint { date: string; minutes: number }

interface DailyGoal {
  goalMin: number;
  todayMin: number;
  percent: number;
  met: boolean;
  streakDays: number;
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

/* ── Daily Goal Card ── */
const GOAL_PRESETS = [15, 30, 45, 60, 90, 120];

function DailyGoalCard({
  data,
  onSave,
}: {
  data: DailyGoal | null;
  onSave: (goalMin: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<number>(data?.goalMin ?? 60);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setDraft(data.goalMin);
  }, [data?.goalMin]);

  if (!data) {
    return (
      <div className="card mb-4">
        <div className="skeleton h-4 w-24 rounded mb-3" />
        <div className="skeleton h-2 w-full rounded-full mb-2" />
        <div className="skeleton h-3 w-32 rounded" />
      </div>
    );
  }

  const pct = Math.round(data.percent * 100);
  const remaining = Math.max(0, data.goalMin - data.todayMin);

  async function handleSave() {
    if (saving) return;
    if (draft === data?.goalMin) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="card mb-4"
      style={{
        borderColor: data.met ? "rgba(34,197,94,0.3)" : "var(--color-border-subtle)",
        background: data.met ? "rgba(34,197,94,0.04)" : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: data.met ? "rgba(34,197,94,0.15)" : "var(--color-accent-soft)",
            }}
          >
            <Target
              size={16}
              style={{ color: data.met ? "var(--color-success)" : "var(--color-accent)" }}
            />
          </div>
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
            >
              Today's Goal
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
              {data.met ? "Goal reached — great work!" : `${data.todayMin} of ${data.goalMin} min`}
            </p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit goal"
            className="p-1.5 rounded-md cursor-pointer transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      {!editing ? (
        <>
          <div className="progress-bar mb-2">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: data.met ? "var(--color-success)" : "var(--color-accent)",
                transition: "width 0.6s var(--ease-out)",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--color-text-muted)" }}>
              {data.met
                ? `+${data.todayMin - data.goalMin} min beyond goal`
                : `${remaining} min to go`}
            </span>
            <span className="font-bold" style={{ color: data.met ? "var(--color-success)" : "var(--color-accent)" }}>
              {pct}%
            </span>
          </div>
        </>
      ) : (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {GOAL_PRESETS.map((m) => {
              const active = draft === m;
              return (
                <button
                  key={m}
                  onClick={() => setDraft(m)}
                  className="text-xs font-medium px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                  style={{
                    background: active ? "var(--color-accent)" : "var(--color-surface-0)",
                    color: active ? "#fff" : "var(--color-text-secondary)",
                  }}
                >
                  {m}m
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={draft}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) setDraft(Math.max(5, Math.min(480, v)));
              }}
              className="flex-1 text-sm px-3 py-1.5 rounded-md border bg-transparent"
              style={{
                borderColor: "var(--color-border-default)",
                color: "var(--color-text-primary)",
              }}
            />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>min/day</span>
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label="Save goal"
              className="p-1.5 rounded-md cursor-pointer"
              style={{ background: "var(--color-accent)", color: "#fff", opacity: saving ? 0.6 : 1 }}
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => { setDraft(data.goalMin); setEditing(false); }}
              aria-label="Cancel"
              className="p-1.5 rounded-md cursor-pointer"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
  const [studyHours, setStudyHours] = useState<StudyHourPoint[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<ProgressOverview>("/progress/overview", { token }).then(setOverview).catch(console.error);
    api<SessionPreview[]>("/chat/sessions", { token }).then(setSessions).catch(console.error);
    api<StudyHourPoint[]>("/progress/study-hours?days=7", { token }).then(setStudyHours).catch(console.error);
    api<DailyGoal>("/progress/today", { token }).then(setDailyGoal).catch(console.error);
  }, [token]);

  async function saveGoal(goalMin: number) {
    if (!token) return;
    const updated = await api<{ goalMin: number }>("/progress/study-goal", {
      method: "PATCH",
      body: { goalMin },
      token,
    });
    setDailyGoal((d) =>
      d ? { ...d, goalMin: updated.goalMin, percent: Math.min(1, d.todayMin / updated.goalMin), met: d.todayMin >= updated.goalMin } : d,
    );
  }

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
  const weekMin = studyHours.reduce((sum, p) => sum + p.minutes, 0);
  const studyH = Math.floor(weekMin / 60);
  const studyM = weekMin % 60;
  const studyTimeStr = studyH > 0 ? `${studyH}h ${studyM}m` : `${studyM}m`;

  const totalMastery = (() => {
    const total = overview?.subjects?.reduce((s, x) => s + x.totalTopics, 0) || 0;
    const mastered = overview?.subjects?.reduce((s, x) => s + x.masteredTopics, 0) || 0;
    return total > 0 ? Math.round((mastered / total) * 100) : 0;
  })();

  const lastSubjectSession = sessions.find((s) => s.mode === "SUBJECT" && s.subject);

  // Recommend the enrolled subject with lowest mastery (at least 1 topic)
  const recommendation = (() => {
    const enrolled = (overview?.subjects ?? []).filter((s) => s.totalTopics > 0);
    if (enrolled.length === 0) return null;
    const weakest = enrolled.reduce((w, s) => (s.overallMastery < w.overallMastery ? s : w));
    if (weakest.overallMastery >= 0.7) return null;
    return weakest;
  })();

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

      {/* Daily goal */}
      <DailyGoalCard data={dailyGoal} onSave={saveGoal} />

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

      {/* Recommendation — weakest enrolled subject */}
      {recommendation && (
        <div className="mb-8">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
          >
            Recommended next
          </p>
          <button
            onClick={() => startChat(recommendation.id)}
            disabled={creating === recommendation.id}
            className="w-full card text-left group flex items-center gap-4 cursor-pointer"
            style={{ borderColor: "rgba(184,134,11,0.25)" }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(184,134,11,0.12)" }}
            >
              <Target size={18} style={{ color: "var(--color-warning)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">
                Strengthen {recommendation.name}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Mastery {Math.round(recommendation.overallMastery * 100)}% · {recommendation.masteredTopics}/{recommendation.totalTopics} topics
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
