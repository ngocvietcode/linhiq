"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import { Home, MessageSquare, TrendingUp, Settings, LogOut, Moon, Bell, Shield, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageSquare, label: "Chat với Linh" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const SETTING_GROUPS = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Profile", desc: "Name, email, profile photo" },
      { icon: Shield, label: "Password & Security", desc: "Change password, 2FA" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Moon, label: "Appearance", desc: "Dark mode · Light mode" },
      { icon: Bell, label: "Notifications", desc: "Study reminders, streak alerts" },
    ],
  },
];

function SettingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-base)" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r fixed inset-y-0 left-0 z-20"
        style={{ background: "var(--color-void)", borderColor: "var(--color-border-subtle)" }}>
        <div className="px-5 py-6 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <span className="text-xl font-bold">
            <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: active ? "var(--color-accent-soft)" : "transparent", color: active ? "var(--color-accent)" : "var(--color-text-secondary)" }}>
                <Icon size={18} />{label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 md:ml-56">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-10 px-5 py-4 border-b"
          style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(16px)", borderColor: "var(--color-border-subtle)" }}>
          <h1 className="text-lg font-bold">Settings</h1>
        </header>

        <main className="px-5 md:px-8 py-8 pb-24 md:pb-8 max-w-xl mx-auto">
          <h1 className="hidden md:block text-2xl font-bold mb-8">Settings</h1>

          {/* User info */}
          <div className="rounded-2xl border p-5 mb-6 flex items-center gap-4"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
              {user?.name?.[0] || "S"}
            </div>
            <div>
              <p className="font-semibold">{user?.name || "Student"}</p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{user?.email}</p>
              <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ background: "var(--color-accent-soft)", color: "var(--color-text-hint)" }}>
                {user?.role || "STUDENT"}
              </span>
            </div>
          </div>

          {/* Settings groups */}
          {SETTING_GROUPS.map((group) => (
            <div key={group.title} className="mb-6">
              <h2 className="text-xs font-semibold mb-2 px-1" style={{ color: "var(--color-text-muted)" }}>
                {group.title.toUpperCase()}
              </h2>
              <div className="rounded-2xl border overflow-hidden"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}>
                {group.items.map(({ icon: Icon, label, desc }, i, arr) => (
                  <button key={label}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.04)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--color-elevated)" }}>
                      <Icon size={16} style={{ color: "var(--color-text-secondary)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
                    </div>
                    <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full rounded-xl border px-5 py-4 flex items-center gap-3 transition-all text-sm font-medium"
            style={{ background: "rgba(244,63,94,0.04)", borderColor: "rgba(244,63,94,0.2)", color: "var(--color-danger)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.08)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.04)")}>
            <LogOut size={16} />
            Sign out
          </button>
        </main>
      </div>

      {/* Bottom Nav */}
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

export default function SettingsPage() {
  return (
    <AuthProvider>
      <SettingsContent />
    </AuthProvider>
  );
}
