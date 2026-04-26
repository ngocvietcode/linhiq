"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { NotificationBell } from "../NotificationBell";

interface AppShellProps {
  children: ReactNode;
  /** Max width of main content (default: "max-w-4xl") */
  maxWidth?: string;
  /** Whether to show the bottom mobile nav (default: true) */
  showBottomNav?: boolean;
  /** Whether to require authentication (default: true) */
  requireAuth?: boolean;
  /** Custom className for the main content area */
  className?: string;
}

/**
 * AppShell — shared layout wrapper for all authenticated pages
 *
 * Provides:
 * - Desktop sidebar (240px, fixed)
 * - Mobile top header with logo
 * - Mobile bottom navigation
 * - Auth guard (redirects to /login if not authenticated)
 * - Consistent content padding and max-width
 */
export function AppShell({
  children,
  maxWidth = "max-w-4xl",
  showBottomNav = true,
  requireAuth = true,
  className = "",
}: AppShellProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (requireAuth && !isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router, requireAuth]);

  // Loading state
  if (isLoading || (requireAuth && !user)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-surface-1)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-surface-1)" }}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 md:ml-[240px] min-h-screen">
        {/* Mobile header */}
        <header
          className="md:hidden sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <span className="text-lg font-semibold">
            <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent)" }}>Linh</span>
            <span style={{ color: "var(--color-text-heading)" }}>IQ</span>
          </span>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
            >
              {user?.name?.[0] || "S"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`px-5 md:px-8 py-8 pb-24 md:pb-8 ${maxWidth} mx-auto ${className}`}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
