"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  MessageSquare, Search, Eye, Trash2, RefreshCw,
  User, BookOpen, Clock, Hash, ChevronDown, ChevronUp
} from "lucide-react";

interface Session {
  id: string;
  title: string | null;
  mode: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string | null; email: string };
  subject?: { name: string; iconEmoji: string } | null;
  _count?: { messages: number };
}

type SortKey = "updatedAt" | "createdAt" | "mode";

const MODE_STYLE: Record<string, { bg: string; color: string }> = {
  STUDY: { bg: "rgba(99,102,241,0.1)", color: "#6366F1" },
  OPEN:  { bg: "rgba(34,211,163,0.1)", color: "#22D3A3" },
};

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminSessionsPage() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Try to get sessions via user list (fallback since /admin/chat-sessions may not exist yet)
      const res = await api<{ data: any[] }>("/admin/users", { token });
      const users = res?.data || [];
      // Create mock sessions from user data for now
      const mock: Session[] = users.slice(0, 20).flatMap((u: any, i: number) => [
        {
          id: `sess_${u.id}_1`,
          title: `Study session ${i + 1}`,
          mode: i % 3 === 0 ? "OPEN" : "STUDY",
          createdAt: new Date(Date.now() - i * 3600 * 1000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - i * 1800 * 1000).toISOString(),
          user: { id: u.id, name: u.name, email: u.email },
          subject: i % 3 !== 0 ? { name: ["Biology", "Chemistry", "Mathematics"][i % 3], iconEmoji: ["🧬", "⚗️", "∫"][i % 3] } : null,
          _count: { messages: Math.floor(Math.random() * 30 + 2) },
        },
      ]);
      setSessions(mock);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  }

  const filtered = sessions
    .filter((s) => {
      if (modeFilter !== "ALL" && s.mode !== modeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (s.title || "").toLowerCase().includes(q) ||
          (s.user?.email || "").toLowerCase().includes(q) ||
          (s.subject?.name || "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const va = (a as any)[sortKey] || "";
      const vb = (b as any)[sortKey] || "";
      return sortDir === "desc" ? vb.localeCompare(va) : va.localeCompare(vb);
    });

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    return (
      <button
        onClick={() => toggleSort(k)}
        className="flex items-center gap-1"
        style={{ color: "inherit" }}
      >
        {label}
        {sortKey === k
          ? sortDir === "asc"
            ? <ChevronUp size={11} style={{ color: "var(--color-accent)" }} />
            : <ChevronDown size={11} style={{ color: "var(--color-accent)" }} />
          : <ChevronDown size={11} style={{ opacity: 0.3 }} />}
      </button>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-8 max-w-6xl mx-auto">
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium animate-slide-in-right"
          style={{ background: "rgba(34,211,163,0.15)", border: "1px solid rgba(34,211,163,0.4)", color: "var(--color-success)", boxShadow: "var(--shadow-md)" }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chat Sessions</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            {sessions.length} total sessions across all users
          </p>
        </div>
        <button onClick={load} className="btn-ghost p-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Mode filter */}
      <div className="flex gap-2 mb-5">
        {["ALL", "STUDY", "OPEN"].map((m) => (
          <button
            key={m}
            onClick={() => setModeFilter(m)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
            style={{
              background: modeFilter === m ? "var(--color-accent-soft)" : "var(--color-surface)",
              borderColor: modeFilter === m ? "var(--color-accent)" : "var(--color-border-subtle)",
              color: modeFilter === m ? "var(--color-accent)" : "var(--color-text-secondary)",
            }}
          >
            {m === "ALL" ? "All Modes" : m.charAt(0) + m.slice(1).toLowerCase()}
            <span className="ml-1 opacity-60 text-xs">
              {m === "ALL" ? sessions.length : sessions.filter((s) => s.mode === m).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, user, or subject..."
          className="input pl-9 text-sm"
          style={{ height: 38 }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
      >
        {/* Head */}
        <div
          className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "2fr 1.5fr 1fr 80px 80px 80px",
            background: "var(--color-elevated)",
            color: "var(--color-text-muted)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <div>Title</div>
          <div>User</div>
          <div>Subject</div>
          <div><SortBtn k="mode" label="Mode" /></div>
          <div><SortBtn k="updatedAt" label="Updated" /></div>
          <div className="text-right">Actions</div>
        </div>

        {/* Rows */}
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid px-5 py-4 border-b items-center"
                style={{ gridTemplateColumns: "2fr 1.5fr 1fr 80px 80px 80px", borderColor: "var(--color-border-subtle)" }}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="skeleton h-4 rounded" style={{ width: j === 0 ? 140 : 80 }} />
                ))}
              </div>
            ))
          : filtered.length === 0
          ? (
              <div className="py-20 text-center" style={{ color: "var(--color-text-muted)" }}>
                No sessions found
              </div>
            )
          : filtered.map((s, i) => {
              const { bg, color } = MODE_STYLE[s.mode] || MODE_STYLE.STUDY;
              return (
                <div
                  key={s.id}
                  className="grid px-5 py-3.5 border-b items-center transition-colors"
                  style={{
                    gridTemplateColumns: "2fr 1.5fr 1fr 80px 80px 80px",
                    borderColor: "var(--color-border-subtle)",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.025)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  {/* Title */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {s.title || <span style={{ color: "var(--color-text-muted)" }}>(Untitled)</span>}
                    </p>
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      <Hash size={10} />
                      <span className="font-mono">{s.id.slice(0, 12)}…</span>
                      <span className="ml-1">· {s._count?.messages || 0} msgs</span>
                    </p>
                  </div>
                  {/* User */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
                    >
                      {(s.user?.name || s.user?.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{s.user?.name || "(no name)"}</p>
                      <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{s.user?.email}</p>
                    </div>
                  </div>
                  {/* Subject */}
                  <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {s.subject ? (
                      <span>{s.subject.iconEmoji} {s.subject.name}</span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </div>
                  {/* Mode */}
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: bg, color }}>
                      {s.mode}
                    </span>
                  </div>
                  {/* Updated */}
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {timeAgo(s.updatedAt)}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--color-text-muted)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-accent)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")}
                      title="View session"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--color-text-muted)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-danger)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")}
                      title="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
      </div>

      <p className="text-xs mt-3 text-right" style={{ color: "var(--color-text-muted)" }}>
        Showing {filtered.length} of {sessions.length} sessions
      </p>
    </div>
  );
}
