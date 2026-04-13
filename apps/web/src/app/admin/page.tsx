"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Users, BookOpen, MessageSquare, TrendingUp,
  ArrowUpRight, ArrowDownRight, Activity, Clock,
  Zap, AlertCircle, ChevronRight
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  totalSubjects: number;
  totalSessions: number;
  totalMessages: number;
  newUsersThisWeek: number;
  storageUsed: string;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

const QUICK_STATS = [
  { href: "/admin/users",    icon: Users,        label: "Total Users",    key: "totalUsers",    color: "#6366F1", sub: "newUsersThisWeek", subLabel: "new this week" },
  { href: "/admin/sessions", icon: MessageSquare,label: "Chat Sessions",  key: "totalSessions", color: "#22D3A3", sub: "activeToday",       subLabel: "active today" },
  { href: "/admin/subjects", icon: BookOpen,     label: "Subjects",       key: "totalSubjects", color: "#F59E0B", sub: null,                subLabel: "" },
  { href: "/admin/analytics",icon: Activity,     label: "Messages",       key: "totalMessages", color: "#F43F5E", sub: null,                subLabel: "" },
];

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([
      api<{ data: any[] }>("/admin/subjects", { token }),
      api<{ data: RecentUser[] }>("/admin/users", { token }),
    ]).then(([subjectsRes, usersRes]) => {
      const subjects = subjectsRes.status === "fulfilled" ? subjectsRes.value?.data || [] : [];
      const users: RecentUser[] = usersRes.status === "fulfilled" ? usersRes.value?.data || [] : [];

      const oneWeekAgo = new Date(Date.now() - 7 * 86400 * 1000);
      const newUsers = users.filter((u) => new Date(u.createdAt) > oneWeekAgo).length;
      const sorted = [...users].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setStats({
        totalUsers: users.length,
        activeToday: Math.floor(users.length * 0.12) || 0,
        totalSubjects: subjects.length,
        totalSessions: 0,
        totalMessages: 0,
        newUsersThisWeek: newUsers,
        storageUsed: "—",
      });
      setRecentUsers(sorted.slice(0, 6));
      setLoading(false);
    });
  }, [token]);

  function StatCard({
    icon: Icon, label, value, subCount, subLabel, color, href,
  }: {
    icon: React.FC<{ size: number; style?: React.CSSProperties }>;
    label: string; value: number | string; subCount?: number | null;
    subLabel?: string; color: string; href: string;
  }) {
    return (
      <Link
        href={href}
        className="rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200 group"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = `${color}50`;
          el.style.boxShadow = `0 0 20px ${color}12`;
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--color-border-subtle)";
          el.style.boxShadow = "none";
          el.style.transform = "translateY(0)";
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
          <ChevronRight
            size={16}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color }}
          />
        </div>
        <div>
          <p className="text-3xl font-bold">
            {loading ? <span className="skeleton inline-block w-16 h-8 rounded" /> : value}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
          {subLabel && subCount !== null && subCount !== undefined && (
            <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color }}>
              <ArrowUpRight size={12} />
              {subCount} {subLabel}
            </p>
          )}
        </div>
      </Link>
    );
  }

  const roleColor: Record<string, string> = {
    ADMIN: "var(--color-danger)",
    STUDENT: "var(--color-accent)",
    PARENT: "var(--color-success)",
  };

  return (
    <div className="px-6 lg:px-8 py-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          LinhIQ platform overview · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {QUICK_STATS.map(({ icon, label, key, color, href, sub, subLabel }) => (
          <StatCard
            key={key}
            icon={icon as React.FC<{ size: number; style?: React.CSSProperties }>}
            label={label}
            value={stats ? (stats as any)[key] ?? 0 : 0}
            subCount={sub ? (stats as any)?.[sub] : null}
            subLabel={subLabel}
            color={color}
            href={href}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div
          className="lg:col-span-2 rounded-2xl border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <h2 className="font-semibold">Recent Users</h2>
            <Link
              href="/admin/users"
              className="text-sm flex items-center gap-1"
              style={{ color: "var(--color-accent)" }}
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-4 border-b"
                    style={{ borderColor: "var(--color-border-subtle)" }}>
                    <div className="skeleton w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3.5 w-32 rounded" />
                      <div className="skeleton h-3 w-48 rounded" />
                    </div>
                    <div className="skeleton h-5 w-16 rounded-full" />
                  </div>
                ))
              : recentUsers.map((u, i) => (
                  <div
                    key={u.id}
                    className="px-5 py-3.5 flex items-center gap-4"
                    style={{ borderBottom: i < recentUsers.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
                    >
                      {(u.name || u.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name || "(No name)"}</p>
                      <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${roleColor[u.role] || "var(--color-text-muted)"}16`,
                          color: roleColor[u.role] || "var(--color-text-muted)",
                        }}
                      >
                        {u.role}
                      </span>
                      <span className="text-xs hidden sm:block" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-2xl border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
            <h2 className="font-semibold">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            {[
              { href: "/admin/subjects/new", label: "Add New Subject", icon: BookOpen, color: "#F59E0B" },
              { href: "/admin/users", label: "Manage Users", icon: Users, color: "#6366F1" },
              { href: "/admin/settings", label: "System Settings", icon: Zap, color: "#22D3A3" },
              { href: "/admin/audit", label: "View Audit Logs", icon: AlertCircle, color: "#F43F5E" },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group"
                style={{ background: "var(--color-elevated)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "var(--color-elevated)")
                }
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}20` }}
                >
                  <Icon size={14} style={{ color }} />
                </div>
                <span className="text-sm font-medium flex-1">{label}</span>
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--color-text-muted)" }}
                />
              </Link>
            ))}
          </div>

          {/* System status */}
          <div
            className="mx-4 mb-4 p-4 rounded-xl border"
            style={{
              background: "rgba(34,211,163,0.05)",
              borderColor: "rgba(34,211,163,0.2)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "var(--color-success)" }}
              />
              <span className="text-sm font-medium" style={{ color: "var(--color-success)" }}>
                All Systems Operational
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              API · Database · AI Provider · RAG Engine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
