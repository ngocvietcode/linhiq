"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  MessageSquare,
  ShieldAlert,
  ListChecks,
  CalendarClock,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/NotificationBell";
import { useParentContext } from "../_lib/parent-context";

const NAV_ITEMS = [
  { href: "/parent", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/parent/reports", icon: BarChart2, label: "Báo cáo" },
  { href: "/parent/chats", icon: MessageSquare, label: "Lịch sử chat" },
  { href: "/parent/alerts", icon: ShieldAlert, label: "Cảnh báo" },
  { href: "/parent/quizzes", icon: ListChecks, label: "Quiz" },
  { href: "/parent/timeline", icon: CalendarClock, label: "Hoạt động" },
  { href: "/parent/link-child", icon: Users, label: "Liên kết tài khoản" },
];

interface ParentShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  rightSlot?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

export function ParentShell({ title, subtitle, rightSlot, children, maxWidth = "56rem" }: ParentShellProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { children: list, activeChildId, setActiveChildId } = useParentContext();

  function isActive(href: string) {
    if (href === "/parent") return pathname === "/parent";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-surface-1)" }}>
      <aside
        className="hidden md:flex flex-col w-60 border-r"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="px-5 py-6 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <span className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ{" "}
            <span className="text-sm font-normal" style={{ color: "var(--color-text-muted)" }}>
              Parent
            </span>
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? "var(--color-accent-soft)" : "transparent",
                  color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                  textDecoration: "none",
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {user?.name ?? "Phụ huynh"}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Tài khoản phụ huynh
          </p>
        </div>
      </aside>

      <div className="flex-1 md:ml-0">
        <header
          className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between gap-4"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {rightSlot}
            {list.length > 1 && (
              <select
                value={activeChildId}
                onChange={(e) => setActiveChildId(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-full border"
                style={{
                  background: "var(--color-surface-2)",
                  borderColor: "var(--color-border-default)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {list.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <NotificationBell />
          </div>
        </header>

        <main className="px-5 md:px-8 py-8 mx-auto" style={{ maxWidth }}>
          {children}
        </main>
      </div>
    </div>
  );
}
