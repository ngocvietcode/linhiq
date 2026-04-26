"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ShieldAlert, ChevronRight } from "lucide-react";
import { ParentShell } from "../_components/ParentShell";
import { useParentContext } from "../_lib/parent-context";

interface AlertItem {
  id: string;
  sessionId: string;
  sessionTitle: string | null;
  sessionMode: "SUBJECT" | "OPEN" | null;
  subject: { name: string; iconEmoji: string } | null;
  content: string;
  createdAt: string;
  category: string | null;
  wasRedirected: boolean;
}

const RANGE_OPTIONS = [
  { value: 14, label: "14 ngày" },
  { value: 30, label: "30 ngày" },
  { value: 90, label: "90 ngày" },
];

const CATEGORY_LABEL: Record<string, string> = {
  EMOTIONAL: "Cảm xúc",
  MATURE_SOFT: "Nhạy cảm",
  AGE_BOUNDARY: "Vượt giới hạn tuổi",
  HARMFUL: "Có hại",
};
const CATEGORY_DESCRIPTION: Record<string, string> = {
  EMOTIONAL: "Liên quan tới tâm trạng/cảm xúc của con. Có thể cần lắng nghe.",
  MATURE_SOFT: "Chủ đề người lớn nhẹ. Hệ thống đã hướng dẫn theo độ tuổi.",
  AGE_BOUNDARY: "Vượt ngưỡng phù hợp lứa tuổi. AI đã định hướng lại.",
  HARMFUL: "Nội dung có thể gây hại. AI đã từ chối và định hướng lại.",
};

export default function ParentAlertsPage() {
  const { token } = useAuth();
  const { activeChild, activeChildId } = useParentContext();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    if (!token || !activeChildId) return;
    setLoading(true);
    api<AlertItem[]>(`/parent/children/${activeChildId}/alerts?days=${days}`, { token })
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, activeChildId, days]);

  return (
    <ParentShell
      title={`Cảnh báo nội dung — ${activeChild?.name ?? ""}`}
      subtitle="Tin nhắn được hệ thống định hướng lại hoặc thuộc nhóm cần chú ý"
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
      {loading && (
        <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
          Đang tải...
        </p>
      )}

      {!loading && alerts.length === 0 && (
        <section
          className="rounded-2xl border p-8 text-center"
          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}
        >
          <ShieldAlert size={32} style={{ color: "var(--color-success)", margin: "0 auto" }} />
          <p className="text-sm font-semibold mt-3" style={{ color: "var(--color-text-primary)" }}>
            Không có cảnh báo nào
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            Trong {days} ngày qua, con đã giữ nội dung chat trong phạm vi an toàn.
          </p>
        </section>
      )}

      {!loading && alerts.length > 0 && (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border p-4"
              style={{
                background: "var(--color-surface-2)",
                borderColor: "rgba(245,158,11,0.3)",
              }}
            >
              <div className="flex items-start gap-3">
                <ShieldAlert size={18} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {a.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(245,158,11,0.15)", color: "var(--color-warning)" }}
                      >
                        {CATEGORY_LABEL[a.category] ?? a.category}
                      </span>
                    )}
                    {a.wasRedirected && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
                      >
                        Đã định hướng lại
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(a.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-sm mb-2 whitespace-pre-wrap" style={{ color: "var(--color-text-primary)" }}>
                    "{a.content}"
                  </p>
                  {a.category && CATEGORY_DESCRIPTION[a.category] && (
                    <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
                      {CATEGORY_DESCRIPTION[a.category]}
                    </p>
                  )}
                  <Link
                    href={`/parent/chats/${a.sessionId}`}
                    className="text-xs font-medium flex items-center gap-1"
                    style={{ color: "var(--color-accent)", textDecoration: "none" }}
                  >
                    Xem buổi chat — {a.subject?.name ?? a.sessionTitle ?? "Tổng quát"}
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ParentShell>
  );
}
