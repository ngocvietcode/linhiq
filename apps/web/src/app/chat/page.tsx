"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { RefreshCw, AlertTriangle } from "lucide-react";

function ChatInitializer() {
  const router = useRouter();
  const { token, isLoading } = useAuth();
  const creatingRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const tryCreate = async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setFailed(false);
    setRetrying(false);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 10_000)
    );

    try {
      const session = await Promise.race([
        api<{ id: string }>("/chat/sessions", { method: "POST", body: {}, token: token ?? undefined }),
        timeout,
      ]);
      router.replace(`/chat/${session.id}`);
    } catch {
      setFailed(true);
      creatingRef.current = false;
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    tryCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isLoading]);

  if (failed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--color-surface-1)" }}>
        <div className="text-center max-w-xs">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--color-danger-soft)", border: "1px solid rgba(166,61,64,0.20)" }}
          >
            <AlertTriangle size={22} style={{ color: "var(--color-danger)" }} />
          </div>
          <h2 className="text-base font-semibold mb-1" style={{ fontFamily: "var(--font-heading)" }}>Không thể kết nối</h2>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
            Linh đang bận hoặc mất kết nối. Thử lại nhé!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-ghost text-sm"
            >
              Về Dashboard
            </button>
            <button
              onClick={() => {
                setRetrying(true);
                tryCreate();
              }}
              disabled={retrying}
              className="btn-primary text-sm"
            >
              <RefreshCw size={14} className={retrying ? "animate-spin" : ""} />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface-1)" }}>
      <div className="space-y-3 text-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Đang kết nối với Linh...</p>
      </div>
    </div>
  );
}

export default function ChatIndexPage() {
  return <ChatInitializer />;
}
