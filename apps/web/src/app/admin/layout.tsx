"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import {
  LayoutDashboard, Users, BookOpen, Brain, MessageSquare,
  Settings, ChevronDown, ChevronRight, LogOut, Shield,
  BarChart2, FileText, Database, Bell, Globe, Menu, X
} from "lucide-react";

const NAV = [
  {
    group: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
      { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
    ],
  },
  {
    group: "Content",
    items: [
      { href: "/admin/subjects", icon: BookOpen, label: "Subjects & Books" },
      { href: "/admin/documents", icon: FileText, label: "Documents" },
      { href: "/admin/knowledge", icon: Brain, label: "Knowledge Base" },
    ],
  },
  {
    group: "Users",
    items: [
      { href: "/admin/users", icon: Users, label: "Users" },
      { href: "/admin/sessions", icon: MessageSquare, label: "Chat Sessions" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/admin/settings", icon: Settings, label: "Settings" },
      { href: "/admin/audit", icon: Shield, label: "Audit Logs" },
    ],
  },
];

function AdminSidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="px-5 py-5 flex items-center justify-between border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div>
          <div className="text-lg font-bold">
            <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ
            <span
              className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-accent)" }}
            >
              ADMIN
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Enterprise Console
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group) => (
          <div key={group.group}>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                    style={{
                      background: active ? "var(--color-accent-soft)" : "transparent",
                      color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <Icon size={16} />
                    {label}
                    {active && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--color-accent)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t flex-shrink-0" style={{ borderColor: "var(--color-border-subtle)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
          >
            {user?.name?.[0] || "A"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
            <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
              {user?.role || "ADMIN"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm w-full px-2 py-1.5 rounded-md transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-danger)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-void)" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (user.role !== "ADMIN") return null;

  return <>{children}</>;
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="min-h-screen flex" style={{ background: "var(--color-void)" }}>
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:flex flex-col w-60 border-r fixed inset-y-0 left-0 z-30 flex-shrink-0"
          style={{ background: "var(--color-base)", borderColor: "var(--color-border-subtle)" }}
        >
          <AdminSidebarContent />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
            />
            <aside
              className="absolute left-0 inset-y-0 w-64 flex flex-col z-50"
              style={{ background: "var(--color-base)", borderRight: "1px solid var(--color-border-subtle)" }}
            >
              <AdminSidebarContent onClose={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
          {/* Mobile top bar */}
          <header
            className="lg:hidden sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b"
            style={{
              background: "rgba(15,23,42,0.9)",
              backdropFilter: "blur(16px)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              style={{ color: "var(--color-text-secondary)" }}
            >
              <Menu size={20} />
            </button>
            <span className="text-base font-bold">
              <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ Admin
            </span>
          </header>

          {/* Page content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
