"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const POLL_MS = 60_000;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationBell() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const fetchCount = () => {
      api<{ count: number }>("/notifications/unread-count", { token })
        .then((r) => { if (!cancelled) setUnread(r.count); })
        .catch(() => { /* silent */ });
    };
    fetchCount();
    const interval = setInterval(fetchCount, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [token]);

  useEffect(() => {
    if (!open || !token) return;
    api<Notification[]>("/notifications?limit=20", { token })
      .then(setItems)
      .catch(() => setItems([]));
  }, [open, token]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markRead(id: string) {
    if (!token) return;
    await api(`/notifications/${id}/read`, { method: "PATCH", token }).catch(() => {});
    setItems((xs) => xs.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    if (!token) return;
    await api("/notifications/read-all", { method: "PATCH", token }).catch(() => {});
    setItems((xs) => xs.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    setUnread(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
        style={{ background: open ? "var(--color-accent-soft)" : "transparent", color: "var(--color-text-secondary)" }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: "var(--color-danger)", color: "#fff" }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-xl border z-50"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border-subtle)",
            boxShadow: "var(--shadow-lg, 0 10px 40px rgba(0,0,0,0.15))",
          }}
        >
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs flex items-center gap-1 cursor-pointer"
                style={{ color: "var(--color-accent)" }}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              items.map((n) => {
                const unreadItem = !n.readAt;
                const inner = (
                  <div
                    className="px-4 py-3 border-b transition-colors"
                    style={{
                      borderColor: "var(--color-border-subtle)",
                      background: unreadItem ? "var(--color-accent-soft)" : "transparent",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {unreadItem && (
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: "var(--color-accent)" }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.body && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                            {n.body}
                          </p>
                        )}
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {unreadItem && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(n.id); }}
                          aria-label="Mark as read"
                          className="p-1 rounded transition-colors cursor-pointer"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => { if (unreadItem) markRead(n.id); setOpen(false); }}
                    className="block"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
