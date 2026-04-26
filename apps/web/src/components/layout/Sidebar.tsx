"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NAV_ITEMS } from "@/lib/constants";
import { LogOut } from "lucide-react";
import { NotificationBell } from "../NotificationBell";

/**
 * Sidebar — "Table of Contents" style navigation
 * Used inside AppShell on desktop (md+)
 */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "Student";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent)" }}>Linh</span>
          <span style={{ color: "var(--color-text-heading)" }}>IQ</span>
        </Link>
        <NotificationBell />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link ${isActive(href) ? "active" : ""}`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
          >
            {firstName[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Student</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm w-full px-2 py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-danger)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}
