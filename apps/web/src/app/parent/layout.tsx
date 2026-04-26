"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ParentProvider } from "./_lib/parent-context";

/** Allow only PARENT and ADMIN to reach /parent/*. STUDENT → /dashboard. */
function ParentGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user.role !== "PARENT" && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-surface-1)" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (user.role !== "PARENT" && user.role !== "ADMIN") return null;

  return <>{children}</>;
}

// Parent portal — light mode wrapper + role guard + shared child-selection context.
export default function ParentLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("parent-mode");
    return () => {
      document.documentElement.classList.remove("parent-mode");
    };
  }, []);

  return (
    <div className="parent-mode-wrapper" style={{ colorScheme: "light" }}>
      <ParentGuard>
        <ParentProvider>{children}</ParentProvider>
      </ParentGuard>
    </div>
  );
}
