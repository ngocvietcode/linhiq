"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  BarChart2, TrendingUp, Users, MessageSquare,
  Clock, Activity, RefreshCw, Calendar
} from "lucide-react";

interface WeekDay { day: string; sessions: number; messages: number; }
interface SubjectStat { name: string; emoji: string; sessions: number; pct: number; }

interface AnalyticsData {
  totalUsers: number;
  totalSessions: number;
  totalSubjects: number;
  weeklyData: WeekDay[];
  subjectStats: SubjectStat[];
  avgSessionMin: number;
  activeUsersToday: number;
}

// Simulated data for dashboard while API endpoints are being wired
function buildMockData(userCount: number, sessionCount: number, subjectCount: number): AnalyticsData {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyData: WeekDay[] = days.map((day) => ({
    day,
    sessions: Math.floor(Math.random() * (sessionCount / 5 + 3)),
    messages: Math.floor(Math.random() * 40 + 5),
  }));
  const subjectStats: SubjectStat[] = [
    { name: "Biology",     emoji: "🧬", sessions: Math.floor(sessionCount * 0.38), pct: 38 },
    { name: "Chemistry",   emoji: "⚗️", sessions: Math.floor(sessionCount * 0.29), pct: 29 },
    { name: "Mathematics", emoji: "∫",  sessions: Math.floor(sessionCount * 0.21), pct: 21 },
    { name: "Physics",     emoji: "🔭", sessions: Math.floor(sessionCount * 0.12), pct: 12 },
  ].filter((_, i) => i < subjectCount);
  return {
    totalUsers: userCount,
    totalSessions: sessionCount,
    totalSubjects: subjectCount,
    weeklyData,
    subjectStats,
    avgSessionMin: 28,
    activeUsersToday: Math.floor(userCount * 0.1),
  };
}

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("7d");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [usersRes, subjectsRes] = await Promise.allSettled([
        api<{ data: any[] }>("/admin/users", { token }),
        api<{ data: any[] }>("/admin/subjects", { token }),
      ]);
      const users = usersRes.status === "fulfilled" ? (usersRes.value?.data?.length || 0) : 0;
      const subjects = subjectsRes.status === "fulfilled" ? (subjectsRes.value?.data?.length || 0) : 0;
      setAnalytics(buildMockData(users, Math.floor(users * 3.5), subjects));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const stats = analytics;
  const maxSessions = stats ? Math.max(...stats.weeklyData.map((d) => d.sessions), 1) : 1;
  const maxMsgs = stats ? Math.max(...stats.weeklyData.map((d) => d.messages), 1) : 1;

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
        <StatCard icon={Users as any}        label="Total Users"        value={stats?.totalUsers || 0}       color="var(--color-accent)" sub={`${stats?.activeUsersToday || 0} active today`} />
        <StatCard icon={MessageSquare as any}label="Chat Sessions"      value={stats?.totalSessions || 0}    color="#22D3A3" />
        <StatCard icon={Clock as any}        label="Avg Session Length" value={`${stats?.avgSessionMin || 0} min`} color="#F59E0B" />
        <StatCard icon={Activity as any}     label="Subjects Active"    value={stats?.totalSubjects || 0}    color="#F43F5E" />
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
                <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#22D3A3" }} /> Messages
              </span>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-48 flex items-end gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1">
                    <div className="skeleton rounded-t-md" style={{ height: `${Math.random() * 70 + 30}%` }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-end gap-2">
                {stats?.weeklyData.map(({ day, sessions, messages }) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    {/* Messages bar (behind) */}
                    <div className="w-full relative flex flex-col items-center gap-0.5">
                      <div
                        className="w-3/4 rounded-sm opacity-40"
                        style={{
                          height: `${(messages / maxMsgs) * 150}px`,
                          background: "#22D3A3",
                          minHeight: 2,
                        }}
                      />
                    </div>
                    {/* Sessions bar */}
                    <div className="relative w-full -mt-14 flex flex-col items-center">
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${(sessions / maxSessions) * 150}px`,
                          background: "linear-gradient(to top, rgba(218,119,86,1), rgba(218,119,86,0.7))",
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
              : (stats?.subjectStats || []).map(({ name, emoji, sessions, pct }) => (
                  <div key={name}>
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

      {/* Engagement metrics */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Messages per Session", value: loading ? "—" : "12.4", icon: MessageSquare, color: "var(--color-accent)" },
          { label: "Avg. Hint Level Used", value: loading ? "—" : "L2.3", icon: BarChart2,    color: "#F59E0B" },
          { label: "Return Rate (7d)",      value: loading ? "—" : "64%",  icon: TrendingUp,   color: "#22D3A3" },
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
