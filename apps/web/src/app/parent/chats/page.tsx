"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { MessageSquare, AlertCircle, ChevronRight } from "lucide-react";
import { ParentShell } from "../_components/ParentShell";
import { useParentContext } from "../_lib/parent-context";

interface SessionItem {
  id: string;
  title: string | null;
  mode: "SUBJECT" | "OPEN";
  subject: { name: string; iconEmoji: string } | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  firstUserMessage: string | null;
  concerningCount: number;
}

const RANGE_OPTIONS = [
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
  { value: 90, label: "90 ngày" },
];

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function ParentChatsPage() {
  const { token } = useAuth();
  const { activeChild, activeChildId } = useParentContext();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [onlyConcerning, setOnlyConcerning] = useState(false);

  useEffect(() => {
    if (!token || !activeChildId) return;
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (onlyConcerning) params.set("onlyConcerning", "true");
    api<SessionItem[]>(`/parent/children/${activeChildId}/sessions?${params}`, { token })
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, activeChildId, days, onlyConcerning]);

  return (
    <ParentShell
      title={`Lịch sử chat của ${activeChild?.name ?? "học sinh"}`}
      subtitle="Xem các buổi chat của con với gia sư AI"
      rightSlot={
        <div className="flex gap-1 rounded-full border p-0.5"
          style={{ borderColor: "var(--color-border-default)" }}>
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setDays(o.value)}
              className="text-xs px-3 py-1 rounded-full transition-colors"
              style={{
                background: days === o.value ? "var(--color-accent)" : "transparent",
                color: days === o.value ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-6 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
          <input
            type="checkbox"
            checked={onlyConcerning}
            onChange={(e) => setOnlyConcerning(e.target.checked)}
            className="cursor-pointer"
          />
          Chỉ hiện buổi có nội dung cần chú ý
        </label>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {sessions.length} buổi
        </span>
      </div>

      {loading && (
        <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
          Đang tải...
        </p>
      )}

      {!loading && sessions.length === 0 && (
        <section
          className="rounded-2xl border p-8 text-center"
          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}
        >
          <MessageSquare size={32} style={{ color: "var(--color-text-muted)", margin: "0 auto" }} />
          <p className="text-sm mt-3" style={{ color: "var(--color-text-secondary)" }}>
            {onlyConcerning ? "Không có buổi chat nào cần chú ý trong khoảng thời gian này." : "Chưa có buổi chat nào."}
          </p>
        </section>
      )}

      {!loading && sessions.length > 0 && (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/parent/chats/${s.id}`}
                className="block rounded-xl border p-4 transition-all"
                style={{
                  background: "var(--color-surface-2)",
                  borderColor: s.concerningCount > 0 ? "rgba(245,158,11,0.35)" : "var(--color-border-subtle)",
                  textDecoration: "none",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                    style={{ background: "var(--color-accent-soft)" }}
                  >
                    {s.subject?.iconEmoji ?? "💬"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                        {s.title || s.firstUserMessage?.slice(0, 60) || "(Không tiêu đề)"}
                      </h3>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{
                          background: s.mode === "SUBJECT" ? "var(--color-accent-soft)" : "rgba(139,92,246,0.12)",
                          color: s.mode === "SUBJECT" ? "var(--color-accent)" : "#8B5CF6",
                        }}
                      >
                        {s.mode === "SUBJECT" ? "Học tập" : "Tổng quát"}
                      </span>
                      {s.concerningCount > 0 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 flex-shrink-0"
                          style={{ background: "rgba(245,158,11,0.15)", color: "var(--color-warning)" }}
                        >
                          <AlertCircle size={10} /> {s.concerningCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                      <span>{s.subject?.name ?? "Tổng quát"}</span>
                      <span>·</span>
                      <span>{s.messageCount} tin nhắn</span>
                      <span>·</span>
                      <span>{formatRelative(s.updatedAt)}</span>
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ParentShell>
  );
}
