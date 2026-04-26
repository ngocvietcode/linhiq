"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Award,
  AlertCircle,
  ListChecks,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { ParentShell } from "../_components/ParentShell";
import { useParentContext } from "../_lib/parent-context";

type EventType = "quiz" | "mastery" | "alert" | "session";

interface TimelineEvent {
  type: EventType;
  at: string;
  payload: Record<string, unknown>;
}

const RANGE_OPTIONS = [
  { value: 14, label: "14 ngày" },
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
  if (d < 30) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

function dayKey(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - dd.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "short" });
}

export default function ParentTimelinePage() {
  const { token } = useAuth();
  const { activeChild, activeChildId } = useParentContext();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    if (!token || !activeChildId) return;
    setLoading(true);
    api<TimelineEvent[]>(`/parent/children/${activeChildId}/timeline?days=${days}`, { token })
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, activeChildId, days]);

  const grouped: Record<string, TimelineEvent[]> = {};
  for (const ev of events) {
    const key = dayKey(ev.at);
    (grouped[key] ||= []).push(ev);
  }

  return (
    <ParentShell
      title={`Hoạt động — ${activeChild?.name ?? ""}`}
      subtitle="Quiz, mastery, tin nhắn cần chú ý — sắp xếp theo ngày"
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

      {!loading && events.length === 0 && (
        <section
          className="rounded-2xl border p-8 text-center"
          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Chưa có hoạt động nào trong khoảng thời gian này.
          </p>
        </section>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([day, items]) => (
          <section key={day}>
            <h2 className="text-xs uppercase tracking-wide font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>
              {day}
            </h2>
            <ul className="space-y-2">
              {items.map((ev, i) => (
                <li key={i}>
                  <EventRow ev={ev} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ParentShell>
  );
}

function EventRow({ ev }: { ev: TimelineEvent }) {
  if (ev.type === "quiz") {
    const p = ev.payload as {
      id: string;
      score: number;
      total: number;
      accuracy: number;
      subject: { name: string; iconEmoji: string } | null;
      topicName: string | null;
      quizType: string;
    };
    const pct = Math.round(p.accuracy * 100);
    const color = pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-accent)" : "var(--color-warning)";
    return (
      <Row icon={<ListChecks size={16} style={{ color: "var(--color-teal)" }} />}>
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
            Làm quiz <strong>{p.topicName ?? "(không tiêu đề)"}</strong>{" "}
            <span style={{ color: "var(--color-text-muted)" }}>· {p.subject?.name ?? "—"}</span>
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{formatRelative(ev.at)}</p>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {p.score}/{p.total} ({pct}%)
        </span>
      </Row>
    );
  }

  if (ev.type === "mastery") {
    const p = ev.payload as {
      topicName: string;
      subject: { name: string; iconEmoji: string };
      masteryLevel: number;
    };
    return (
      <Row icon={<Award size={16} style={{ color: "var(--color-gold)" }} />}>
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
            Đạt mastery <strong>{p.topicName}</strong>{" "}
            <span style={{ color: "var(--color-text-muted)" }}>· {p.subject.name}</span>
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{formatRelative(ev.at)}</p>
        </div>
        <span className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
          {Math.round(p.masteryLevel * 100)}%
        </span>
      </Row>
    );
  }

  if (ev.type === "alert") {
    const p = ev.payload as {
      messageId: string;
      sessionId: string;
      content: string;
      category: string | null;
      wasRedirected: boolean;
    };
    return (
      <Link href={`/parent/chats/${p.sessionId}`} style={{ textDecoration: "none" }}>
        <Row
          icon={<AlertCircle size={16} style={{ color: "var(--color-warning)" }} />}
          highlight
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
              Tin nhắn cần chú ý: "{p.content.slice(0, 80)}{p.content.length > 80 ? "..." : ""}"
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {p.category ?? "—"} · {formatRelative(ev.at)}
            </p>
          </div>
          <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
        </Row>
      </Link>
    );
  }

  // session
  const p = ev.payload as {
    id: string;
    title: string | null;
    mode: string;
    subject: { name: string; iconEmoji: string } | null;
    messageCount: number;
  };
  return (
    <Link href={`/parent/chats/${p.id}`} style={{ textDecoration: "none" }}>
      <Row icon={<MessageSquare size={16} style={{ color: "var(--color-accent)" }} />}>
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
            Bắt đầu chat <strong>{p.title || "(không tiêu đề)"}</strong>
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {p.subject?.name ?? "Tổng quát"} · {p.messageCount} tin nhắn · {formatRelative(ev.at)}
          </p>
        </div>
        <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
      </Row>
    </Link>
  );
}

function Row({
  icon, children, highlight,
}: {
  icon: React.ReactNode; children: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-3 flex items-center gap-3"
      style={{
        background: "var(--color-surface-2)",
        borderColor: highlight ? "rgba(245,158,11,0.3)" : "var(--color-border-subtle)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--color-surface-1)" }}
      >
        {icon}
      </div>
      {children}
    </div>
  );
}
