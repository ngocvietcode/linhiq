"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme, type Accent } from "@/lib/theme-context";
import { LogOut, Moon, Sun, Bell, Shield, User, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import toast from "react-hot-toast";

function SettingsContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, accent, setAccent, resolvedTheme } = useTheme();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <AppShell maxWidth="max-w-xl">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      {/* User info */}
      <div className="card mb-6 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
        >
          {user?.name?.[0] || "S"}
        </div>
        <div>
          <p className="font-semibold">{user?.name || "Student"}</p>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {user?.email || (user?.username ? `@${user.username}` : "")}
          </p>
          <span
            className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
            style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-text)" }}
          >
            {user?.role || "STUDENT"}
          </span>
        </div>
      </div>

      {/* Account group */}
      <div className="mb-6">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
        >
          Account
        </p>
        <div className="card p-0 overflow-hidden">
          <button
            onClick={() => toast("Feature coming soon", { icon: "🚧" })}
            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors cursor-pointer"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-accent-soft)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-surface-0)" }}
            >
              <User size={16} style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Profile</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Name, email, profile photo</p>
            </div>
            <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>›</span>
          </button>

          <button
            onClick={() => toast("Feature coming soon", { icon: "🚧" })}
            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors cursor-pointer"
            style={{ borderBottom: user?.role === "STUDENT" ? "1px solid var(--color-border-subtle)" : "none" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-accent-soft)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-surface-0)" }}
            >
              <Shield size={16} style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Password & Security</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Change password, 2FA</p>
            </div>
            <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>›</span>
          </button>

          {user?.role === "STUDENT" && (
            <Link
              href="/parent-link"
              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors cursor-pointer"
              style={{ textDecoration: "none", color: "inherit" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-accent-soft)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--color-surface-0)" }}
              >
                <Users size={16} style={{ color: "var(--color-text-secondary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Liên kết phụ huynh</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Nhập mã 6 chữ số phụ huynh đã đưa
                </p>
              </div>
              <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>›</span>
            </Link>
          )}
        </div>
      </div>

      {/* Preferences group */}
      <div className="mb-6">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.06em" }}
        >
          Preferences
        </p>
        <div className="card p-0 overflow-hidden">
          {/* Appearance row */}
          <div
            className="w-full flex items-center gap-4 px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-surface-0)" }}
            >
              {resolvedTheme === "dark" ? (
                <Moon size={16} style={{ color: "var(--color-text-secondary)" }} />
              ) : (
                <Sun size={16} style={{ color: "var(--color-text-secondary)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Appearance</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {resolvedTheme === "dark" ? "Dark mode" : "Light mode"}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer"
              style={{
                background: "var(--color-surface-0)",
                borderColor: "var(--color-border-default)",
                color: "var(--color-text-secondary)",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-default)")}
            >
              {resolvedTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              {resolvedTheme === "dark" ? "Light" : "Dark"}
            </button>
          </div>

          {/* Accent color row */}
          <div
            className="w-full flex items-center gap-4 px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-surface-0)" }}
            >
              <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>◆</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Accent colour</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Personalise your experience
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {(["blue", "slate", "sage", "wine"] as Accent[]).map((a) => {
                const colors: Record<Accent, string> = {
                  blue: "#2D4A8A",
                  slate: "#475569",
                  sage: "#4A7766",
                  wine: "#7A3B4E",
                };
                return (
                  <button
                    key={a}
                    onClick={() => setAccent(a)}
                    title={a}
                    className="w-6 h-6 rounded-full border-2 transition-all cursor-pointer"
                    style={{
                      background: colors[a],
                      borderColor: accent === a ? "var(--color-text-primary)" : "transparent",
                      transform: accent === a ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Notifications row */}
          <button
            onClick={() => toast("Feature coming soon", { icon: "🚧" })}
            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors cursor-pointer"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-accent-soft)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-surface-0)" }}
            >
              <Bell size={16} style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Notifications</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Study reminders, streak alerts</p>
            </div>
            <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>›</span>
          </button>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="w-full rounded-lg border px-5 py-4 flex items-center gap-3 transition-colors text-sm font-medium cursor-pointer"
        style={{
          background: "var(--color-danger-soft)",
          borderColor: "rgba(166,61,64,0.2)",
          color: "var(--color-danger)",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(166,61,64,0.10)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-danger-soft)")}
      >
        <LogOut size={16} />
        Sign out
      </button>
    </AppShell>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
