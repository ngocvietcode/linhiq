"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api";

function ChatInitializer() {
  const router = useRouter();
  const { token, isLoading } = useAuth();
  const creatingRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    if (creatingRef.current) return;
    creatingRef.current = true;

    // Create a new "Chat với Linh" (Open chat) session
    api<{ id: string }>("/chat/sessions", { method: "POST", body: {}, token })
      .then((session) => {
        router.replace(`/chat/${session.id}`);
      })
      .catch((err) => {
        console.error(err);
        router.replace("/dashboard");
      });
  }, [token, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-base)" }}>
      <div className="space-y-3 text-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }} />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Đang kết nối với Linh...</p>
      </div>
    </div>
  );
}

export default function ChatIndexPage() {
  return (
    <AuthProvider>
      <ChatInitializer />
    </AuthProvider>
  );
}
