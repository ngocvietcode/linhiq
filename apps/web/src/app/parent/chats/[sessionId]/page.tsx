"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { ParentShell } from "../../_components/ParentShell";
import { useParentContext } from "../../_lib/parent-context";

interface SessionMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  safeCategory: string | null;
  wasRedirected: boolean;
  hintLevel: string | null;
}

interface SessionDetail {
  id: string;
  title: string | null;
  mode: "SUBJECT" | "OPEN";
  createdAt: string;
  subject: { name: string; iconEmoji: string } | null;
  messages: SessionMessage[];
}

const CONCERNING = new Set(["EMOTIONAL", "MATURE_SOFT", "AGE_BOUNDARY", "HARMFUL"]);

const CATEGORY_LABEL: Record<string, string> = {
  ACADEMIC: "Học tập",
  GENERAL: "Tổng quát",
  HOBBIES: "Sở thích",
  LIFE: "Đời sống",
  EMOTIONAL: "Cảm xúc",
  MATURE_SOFT: "Nhạy cảm",
  AGE_BOUNDARY: "Cần định hướng",
  HARMFUL: "Có hại",
};

export default function ParentChatTranscriptPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { token } = useAuth();
  const { activeChild, activeChildId } = useParentContext();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !activeChildId || !sessionId) return;
    setLoading(true);
    api<SessionDetail>(`/parent/children/${activeChildId}/sessions/${sessionId}`, { token })
      .then(setSession)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, activeChildId, sessionId]);

  return (
    <ParentShell
      title={session?.title || "Buổi chat"}
      subtitle={
        session
          ? `${session.subject?.name ?? "Tổng quát"} · ${new Date(session.createdAt).toLocaleString("vi-VN")}`
          : activeChild?.name
      }
      rightSlot={
        <Link
          href="/parent/chats"
          className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
          style={{
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-secondary)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> Quay lại
        </Link>
      }
      maxWidth="44rem"
    >
      {loading && (
        <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
          Đang tải...
        </p>
      )}

      {!loading && !session && (
        <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
          Không tìm thấy buổi chat.
        </p>
      )}

      {session && (
        <div className="space-y-3">
          {session.messages.map((m) => {
            const isUser = m.role === "user";
            const concerning = m.wasRedirected || (m.safeCategory && CONCERNING.has(m.safeCategory));
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-3 border"
                  style={{
                    background: isUser
                      ? "var(--color-accent-soft)"
                      : "var(--color-surface-2)",
                    borderColor: concerning
                      ? "rgba(245,158,11,0.4)"
                      : "var(--color-border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[10px] uppercase tracking-wide font-semibold"
                      style={{
                        color: isUser ? "var(--color-accent)" : "var(--color-text-muted)",
                      }}
                    >
                      {isUser ? activeChild?.name ?? "Học sinh" : "Linh AI"}
                    </span>
                    {m.safeCategory && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: concerning ? "rgba(245,158,11,0.15)" : "var(--color-border-subtle)",
                          color: concerning ? "var(--color-warning)" : "var(--color-text-muted)",
                        }}
                      >
                        {CATEGORY_LABEL[m.safeCategory] ?? m.safeCategory}
                      </span>
                    )}
                    {m.wasRedirected && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: "rgba(245,158,11,0.15)", color: "var(--color-warning)" }}
                      >
                        <AlertCircle size={10} /> Đã định hướng lại
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-primary)" }}>
                    {m.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ParentShell>
  );
}
