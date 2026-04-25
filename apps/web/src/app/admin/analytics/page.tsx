"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  BarChart2, TrendingUp, Users, MessageSquare,
  Clock, Activity, RefreshCw
} from "lucide-react";

interface WeekDay { day: string; date: string; sessions: number; messages: number; }
interface SubjectStat { subjectId: string; name: string; emoji: string; sessions: number; pct: number; }

interface Overview {
  period: "7d" | "30d" | "all";
  totalUsers: number;
  totalSessions: number;
  totalSubjects: number;
  activeUsersToday: number;
  totalMessages: number;
  avgSessionMin: number;
  weeklyData: WeekDay[];
  subjectStats: SubjectStat[];
  engagement: {
    messagesPerSession: number;
    avgHintLevel: number;
    returnRate7d: number;
  };
}

interface ChatCategories {
  totals: { academic: number; general: number; hobbies: number; life: number; redirected: number; totalMsg: number };
  ratios: { academic: number; general: number; hobbies: number; life: number; redirected: number };
}

const CATEGORY_META = [
  { k: "academic" as const,   label: "Academic",   color: "var(--color-accent)" },
  { k: "general"  as const,   label: "General",    color: "var(--color-teal)" },
  { k: "hobbies"  as const,   label: "Hobbies",    color: "var(--color-gold)" },
  { k: "life"     as const,   label: "Life",       color: "#8B5CF6" },
  { k: "redirected" as const, label: "Redirected", color: "var(--color-warning)" },
];

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [categories, setCategories] = useState<ChatCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("7d");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ov, cat] = await Promise.all([
        api<Overview>(`/admin/analytics/overview?period=${period}`, { token }),
        api<ChatCategories>("/admin/analytics/chat-categories", { token }),
      ]);
      setOverview(ov);
      setCategories(cat);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => { load(); }, [load]);

  const maxSessions = overview ? Math.max(...overview.weeklyData.map((d) => d.sessions), 1) : 1;
  const maxMsgs = overview ? Math.max(...overview.weeklyData.map((d) => d.messages), 1) : 1;

  function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.FC<{ size: number; style?: React.CSSProperties }>;
    label: string; value: string | number; sub?: string; color: string;
  }) {
    return (
      <div
        className="rounded-2xl border p-5"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18` }}>
            <Icon size={20} style={{ color }} />
          </div>
          <TrendingUp size={14} style={{ color: "var(--color-success)" }} />
        </div>
        <p className="text-3xl font-bold">
          {loading ? <span className="skeleton inline-block w-16 h-8 rounded" /> : value}
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
        {sub && <p className="text-xs mt-1.5" style={{ color: "var(--color-success)" }}>{sub}</p>}
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            Platform-wide usage metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border-subtle)" }}>
            {(["7d", "30d", "all"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1.5 text-sm font-medium transition-all"
                style={{
                  background: period === p ? "var(--color-accent)" : "var(--color-surface)",
                  color: period === p ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {p === "all" ? "All time" : p}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-ghost p-2">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users as any}         label="Total Students"     value={overview?.totalUsers ?? 0}       color="var(--color-accent)" sub={`${overview?.activeUsersToday ?? 0} active today`} />
        <StatCard icon={MessageSquare as any} label="Chat Sessions"      value={overview?.totalSessions ?? 0}    color="var(--color-teal)" />
        <StatCard icon={Clock as any}         label="Avg Session Length" value={`${overview?.avgSessionMin ?? 0} min`} color="var(--color-gold)" />
        <StatCard icon={Activity as any}      label="Subjects Active"    value={overview?.totalSubjects ?? 0}    color="#F43F5E" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions chart */}
        <div
          className="lg:col-span-2 rounded-2xl border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <h2 className="font-semibold">Weekly Activity</h2>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "var(--color-accent)" }} /> Sessions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "var(--color-teal)" }} /> Messages
              </span>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-48 flex items-end gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1">
                    <div className="skeleton rounded-t-md" style={{ height: `${50 + (i * 5)}%` }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-end gap-2">
                {overview?.weeklyData.map(({ day, date, sessions, messages }) => (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative flex flex-col items-center gap-0.5">
                      <div
                        className="w-3/4 rounded-sm opacity-40"
                        style={{
                          height: `${(messages / maxMsgs) * 150}px`,
                          background: "var(--color-teal)",
                          minHeight: 2,
                        }}
                      />
                    </div>
                    <div className="relative w-full -mt-14 flex flex-col items-center">
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${(sessions / maxSessions) * 150}px`,
                          background: "linear-gradient(to top, var(--color-accent-border), var(--color-accent-border))",
                          minHeight: 4,
                        }}
                        title={`${sessions} sessions, ${messages} messages`}
                      />
                    </div>
                    <span className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subject breakdown */}
        <div
          className="rounded-2xl border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <h2 className="font-semibold">By Subject</h2>
          </div>
          <div className="p-5 space-y-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="skeleton h-4 w-24 rounded" />
                      <div className="skeleton h-4 w-10 rounded" />
                    </div>
                    <div className="skeleton h-2 w-full rounded-full" />
                  </div>
                ))
              : overview && overview.subjectStats.length === 0
                ? <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>No sessions yet for this period.</p>
                : (overview?.subjectStats ?? []).map(({ subjectId, name, emoji, sessions, pct }) => (
                    <div key={subjectId}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          {emoji} {name}
                        </span>
                        <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
                          {sessions} sessions
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
          </div>
        </div>
      </div>

      {/* Chat category distribution */}
      <div
        className="mt-6 rounded-2xl border"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border-subtle)" }}>
          <h2 className="font-semibold">Chat Category Distribution</h2>
          {categories && (
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {categories.totals.totalMsg} user messages classified
            </span>
          )}
        </div>
        <div className="p-6">
          {loading ? (
            <div className="skeleton h-3 w-full rounded-full" />
          ) : !categories || categories.totals.totalMsg === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
              No classified chat messages yet.
            </p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden mb-5" style={{ background: "var(--color-border-subtle)" }}>
                {CATEGORY_META.map((c) => {
                  const pct = categories.ratios[c.k] * 100;
                  if (pct <= 0) return null;
                  return <div key={c.k} style={{ width: `${pct}%`, background: c.color }} title={`${c.label} · ${pct.toFixed(0)}%`} />;
                })}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {CATEGORY_META.map((c) => {
                  const pct = Math.round(categories.ratios[c.k] * 100);
                  const n = categories.totals[c.k];
                  return (
                    <div key={c.k} className="flex items-start gap-2">
                      <span className="inline-block w-3 h-3 rounded-sm mt-1 flex-shrink-0" style={{ background: c.color }} />
                      <div>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.label}</p>
                        <p className="text-sm font-semibold">{pct}% <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>({n})</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Engagement metrics */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Messages per Session",
            value: loading ? "—" : overview?.engagement.messagesPerSession.toFixed(1) ?? "0.0",
            icon: MessageSquare,
            color: "var(--color-accent)",
          },
          {
            label: "Avg. Hint Level Used",
            value: loading ? "—" : `L${overview?.engagement.avgHintLevel.toFixed(1) ?? "1.0"}`,
            icon: BarChart2,
            color: "var(--color-gold)",
          },
          {
            label: "Return Rate (7d)",
            value: loading ? "—" : `${Math.round((overview?.engagement.returnRate7d ?? 0) * 100)}%`,
            icon: TrendingUp,
            color: "var(--color-teal)",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border p-5 flex items-center gap-4"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
