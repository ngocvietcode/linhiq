"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  adminSessions,
  type AdminSession,
  type AdminSessionDetail,
  type AdminSessionsListResponse,
  type AdminMessage,
  type ChatMode,
} from "@/lib/admin-api";
import {
  Search, Eye, Trash2, RefreshCw, Hash, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, X, AlertTriangle, Check,
  MessageSquare, Bot, User as UserIcon, Sparkles, BookOpen,
  Clock, Zap, AlertCircle,
} from "lucide-react";

type SortKey = "updatedAt" | "createdAt";

const MODE_STYLE: Record<ChatMode, { bg: string; color: string; label: string }> = {
  SUBJECT: { bg: "var(--color-accent-soft)", color: "var(--color-accent)", label: "Subject" },
  OPEN: { bg: "rgba(34,211,163,0.1)", color: "var(--color-teal)", label: "Open" },
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
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const search = sp.get("q") || "";
  const modeFilter = (sp.get("mode") || "ALL") as ChatMode | "ALL";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = 25;
  const sortKey = (sp.get("sortBy") || "updatedAt") as SortKey;
  const sortDir = (sp.get("sortDir") || "desc") as "asc" | "desc";

  const setParam = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    router.replace(`${pathname}?${next.toString()}`);
  }, [sp, router, pathname]);

  const [resp, setResp] = useState<AdminSessionsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; body: string; onOk: () => void } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await adminSessions.list(token, {
        q: search || undefined,
        mode: modeFilter === "ALL" ? undefined : modeFilter,
        page,
        pageSize,
        sortBy: sortKey,
        sortDir,
      });
      setResp(r);
    } catch (e: any) {
      showToast(e.message || "Failed to load sessions", "err");
    } finally {
      setLoading(false);
    }
  }, [token, search, modeFilter, page, sortKey, sortDir]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSelected(new Set()); }, [page, search, modeFilter]);

  function handleSort(k: SortKey) {
    if (sortKey === k) setParam({ sortDir: sortDir === "asc" ? "desc" : "asc", page: "1" });
    else setParam({ sortBy: k, sortDir: "desc", page: "1" });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function deleteSession(s: AdminSession) {
    if (!token) return;
    setConfirm({
      title: "Delete session?",
      body: `Permanently delete "${s.title || "Untitled"}" by ${s.user.email}. All ${s._count.messages} messages will be removed.`,
      onOk: async () => {
        try {
          await adminSessions.delete(token, s.id);
          showToast("Session deleted");
          load();
        } catch (e: any) { showToast(e.message, "err"); }
        finally { setConfirm(null); }
      },
    });
  }

  function bulkDelete() {
    if (!token || selected.size === 0) return;
    const ids = Array.from(selected);
    setConfirm({
      title: `Delete ${ids.length} sessions?`,
      body: "All selected sessions and their messages will be permanently removed.",
      onOk: async () => {
        try {
          const r = await adminSessions.bulkDelete(token, ids);
          showToast(`Deleted ${r.data.deleted} session(s)`);
          setSelected(new Set());
          load();
        } catch (e: any) { showToast(e.message, "err"); }
        finally { setConfirm(null); }
      },
    });
  }

  const sessions = resp?.data || [];
  const counts = resp?.counts || { all: 0, SUBJECT: 0, OPEN: 0 };
  const totalPages = resp?.pagination.totalPages || 1;
  const total = resp?.pagination.total || 0;

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    return (
      <button onClick={() => handleSort(k)} className="flex items-center gap-1" style={{ color: "inherit" }}>
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
      {toast && <Toast {...toast} />}
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
      {detailId && token && (
        <SessionDetailDrawer
          id={detailId}
          token={token}
          onClose={() => setDetailId(null)}
          onDeleted={() => { setDetailId(null); load(); showToast("Session deleted"); }}
          onError={(m) => showToast(m, "err")}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chat Sessions</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            {counts.all} total · {counts.SUBJECT} subject · {counts.OPEN} open
          </p>
        </div>
        <button onClick={load} className="btn-ghost p-2" title="Refresh">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {(["ALL", "SUBJECT", "OPEN"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setParam({ mode: m === "ALL" ? null : m, page: "1" })}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
            style={{
              background: modeFilter === m ? "var(--color-accent-soft)" : "var(--color-surface-2)",
              borderColor: modeFilter === m ? "var(--color-accent)" : "var(--color-border-subtle)",
              color: modeFilter === m ? "var(--color-accent)" : "var(--color-text-secondary)",
            }}
          >
            {m === "ALL" ? "All Modes" : MODE_STYLE[m].label}
            <span className="ml-1.5 text-xs opacity-60">
              {m === "ALL" ? counts.all : counts[m]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setParam({ q: e.target.value || null, page: "1" })}
            placeholder="Search by title, user email/name, or subject..."
            className="input pl-9 text-sm"
            style={{ height: 38 }}
          />
        </div>
        {selected.size > 0 && (
          <button
            onClick={bulkDelete}
            className="btn-ghost text-sm px-3 gap-1.5"
            style={{ color: "var(--color-danger)", borderColor: "rgba(244,63,94,0.3)" }}
          >
            <Trash2 size={14} /> Delete {selected.size}
          </button>
        )}
      </div>

      <div className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}>
        <div
          className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "36px 2fr 1.5fr 1fr 90px 90px 70px",
            background: "var(--color-surface-0)",
            color: "var(--color-text-muted)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <div>
            <input
              type="checkbox"
              checked={selected.size > 0 && selected.size === sessions.length}
              onChange={(e) => setSelected(e.target.checked ? new Set(sessions.map((s) => s.id)) : new Set())}
              className="rounded"
            />
          </div>
          <div>Title</div>
          <div>User</div>
          <div>Subject</div>
          <div>Mode</div>
          <div><SortBtn k="updatedAt" label="Updated" /></div>
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid px-5 py-4 border-b items-center gap-3"
              style={{ gridTemplateColumns: "36px 2fr 1.5fr 1fr 90px 90px 70px", borderColor: "var(--color-border-subtle)" }}>
              <div className="skeleton w-5 h-5 rounded" />
              <div className="skeleton h-4 rounded w-40" />
              <div className="flex items-center gap-2">
                <div className="skeleton w-6 h-6 rounded-full" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-5 w-14 rounded-full" />
              <div className="skeleton h-3 w-12 rounded" />
              <div />
            </div>
          ))
        ) : sessions.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--color-text-muted)" }}>
            <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
            No sessions found
          </div>
        ) : sessions.map((s) => {
          const ms = MODE_STYLE[s.mode];
          return (
            <div
              key={s.id}
              className="grid px-5 py-3.5 border-b items-center transition-colors"
              style={{
                gridTemplateColumns: "36px 2fr 1.5fr 1fr 90px 90px 70px",
                borderColor: "var(--color-border-subtle)",
                background: selected.has(s.id) ? "var(--color-accent-soft)" : "transparent",
              }}
              onMouseEnter={(e) => { if (!selected.has(s.id)) (e.currentTarget as HTMLElement).style.background = "var(--color-accent-soft)"; }}
              onMouseLeave={(e) => { if (!selected.has(s.id)) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div>
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} className="rounded" />
              </div>
              <button onClick={() => setDetailId(s.id)} className="text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {s.title || <span style={{ color: "var(--color-text-muted)" }}>(Untitled)</span>}
                </p>
                <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  <Hash size={10} />
                  <span className="font-mono">{s.id.slice(0, 12)}…</span>
                  <span className="ml-1">· {s._count.messages} msgs</span>
                  {s.topicStats?.redirected ? (
                    <span className="ml-1 inline-flex items-center gap-0.5" style={{ color: "var(--color-warning)" }}>
                      · <AlertCircle size={9} /> {s.topicStats.redirected} redirected
                    </span>
                  ) : null}
                </p>
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
                  {(s.user.name || s.user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.user.name || "(no name)"}</p>
                  <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{s.user.email}</p>
                </div>
              </div>
              <div className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>
                {s.subject ? <span>{s.subject.iconEmoji} {s.subject.name}</span>
                  : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
              </div>
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: ms.bg, color: ms.color }}>
                  {ms.label}
                </span>
              </div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {timeAgo(s.updatedAt)}
              </div>
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => setDetailId(s.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--color-text-muted)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-accent)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")}
                  title="View session"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => deleteSession(s)}
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

      {!loading && total > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setParam({ page: String(page - 1) })}
              className="p-1.5 rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: "var(--color-border-subtle)" }}
            ><ChevronLeft size={14} /></button>
            <span className="px-3 font-medium" style={{ color: "var(--color-text-primary)" }}>{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setParam({ page: String(page + 1) })}
              className="p-1.5 rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: "var(--color-border-subtle)" }}
            ><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────

function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <div
      className="fixed top-5 right-5 z-[60] px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-slide-in-right"
      style={{
        background: type === "ok" ? "rgba(34,211,163,0.15)" : "rgba(244,63,94,0.15)",
        border: `1px solid ${type === "ok" ? "rgba(34,211,163,0.4)" : "rgba(244,63,94,0.4)"}`,
        color: type === "ok" ? "var(--color-success)" : "var(--color-danger)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {type === "ok" ? <Check size={14} /> : <X size={14} />}
      {msg}
    </div>
  );
}

function ConfirmModal({
  title, body, onOk, onCancel,
}: { title: string; body: string; onOk: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="rounded-2xl border p-6 w-full max-w-sm animate-fade-up"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-default)" }}>
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-full flex-shrink-0" style={{ background: "rgba(244,63,94,0.15)" }}>
            <AlertTriangle size={18} style={{ color: "var(--color-danger)" }} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">{title}</h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>{body}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onOk} className="btn-primary flex-1" style={{ background: "var(--color-danger)" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionDetailDrawer({
  id, token, onClose, onDeleted, onError,
}: {
  id: string;
  token: string;
  onClose: () => void;
  onDeleted: () => void;
  onError: (m: string) => void;
}) {
  const [data, setData] = useState<AdminSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    adminSessions.get(token, id)
      .then((r) => setData(r.data))
      .catch((e) => onError(e.message))
      .finally(() => setLoading(false));
  }, [id, token, onError]);

  async function handleDelete() {
    try {
      await adminSessions.delete(token, id);
      onDeleted();
    } catch (e: any) { onError(e.message); setConfirm(false); }
  }

  return (
    <div
      className="fixed inset-0 z-[55] flex justify-end"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-full overflow-y-auto border-l animate-slide-in-right"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-default)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {confirm && (
          <ConfirmModal
            title="Delete this session?"
            body="All messages will be permanently removed."
            onOk={handleDelete}
            onCancel={() => setConfirm(false)}
          />
        )}

        <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between"
          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}>
          <div>
            <h2 className="font-bold text-lg truncate">
              {data?.title || "Session Detail"}
            </h2>
            {data && (
              <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                <Hash size={10} /> <span className="font-mono">{data.id}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setConfirm(true)}
              className="p-2 rounded-lg"
              style={{ color: "var(--color-danger)" }}
              title="Delete session"
            >
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg" style={{ color: "var(--color-text-muted)" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-20 rounded-xl" />
              <div className="skeleton h-32 rounded-xl" />
              <div className="skeleton h-32 rounded-xl" />
            </div>
          ) : !data ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-muted)" }}>Failed to load</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <InfoCard icon={UserIcon} label="User" value={data.user.name || data.user.email} sub={data.user.email} />
                <InfoCard icon={BookOpen} label="Subject" value={data.subject ? `${data.subject.iconEmoji} ${data.subject.name}` : "—"} />
                <InfoCard icon={Sparkles} label="Mode" value={MODE_STYLE[data.mode].label} sub={`Hint level ${data.hintLevel}`} />
                <InfoCard icon={Clock} label="Updated" value={timeAgo(data.updatedAt)} sub={new Date(data.createdAt).toLocaleString()} />
              </div>

              {data.topicStats && data.topicStats.totalMsg > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                    Topic Categorization
                  </h3>
                  <div className="rounded-xl border p-3 grid grid-cols-5 gap-2 text-center text-xs"
                    style={{ background: "var(--color-surface-0)", borderColor: "var(--color-border-subtle)" }}>
                    <Stat label="Academic" value={data.topicStats.academic} />
                    <Stat label="General" value={data.topicStats.general} />
                    <Stat label="Hobbies" value={data.topicStats.hobbies} />
                    <Stat label="Life" value={data.topicStats.life} />
                    <Stat label="Redirected" value={data.topicStats.redirected} warn />
                  </div>
                </div>
              )}

              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center justify-between" style={{ color: "var(--color-text-muted)" }}>
                <span>Messages ({data._count.messages})</span>
                {data.messages.length < data._count.messages && (
                  <span className="text-[10px] normal-case font-normal opacity-70">Showing first {data.messages.length}</span>
                )}
              </h3>

              <div className="space-y-3">
                {data.messages.map((m) => <MessageBubble key={m.id} m={m} />)}
                {data.messages.length === 0 && (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
                    No messages
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, sub }: { icon: React.FC<{ size: number }>; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border p-3" style={{ background: "var(--color-surface-0)", borderColor: "var(--color-border-subtle)" }}>
      <div className="flex items-center gap-1.5 mb-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <Icon size={12} /> {label}
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
      {sub && <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</p>}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div>
      <p className="font-bold text-base" style={{ color: warn && value > 0 ? "var(--color-warning)" : "var(--color-text-primary)" }}>
        {value}
      </p>
      <p style={{ color: "var(--color-text-muted)" }}>{label}</p>
    </div>
  );
}

function MessageBubble({ m }: { m: AdminMessage }) {
  const isUser = m.role === "user";
  const isAssistant = m.role === "assistant";
  const Icon = isUser ? UserIcon : isAssistant ? Bot : Sparkles;
  return (
    <div className="rounded-xl border p-3"
      style={{
        background: isUser ? "var(--color-surface-0)" : "var(--color-accent-soft)",
        borderColor: isUser ? "var(--color-border-subtle)" : "rgba(99,102,241,0.2)",
      }}>
      <div className="flex items-center justify-between mb-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <div className="flex items-center gap-1.5">
          <Icon size={12} />
          <span className="font-semibold uppercase">{m.role}</span>
          {m.hintLevel && (
            <span className="px-1.5 py-0.5 rounded text-[10px]"
              style={{ background: "var(--color-surface-2)", color: "var(--color-text-secondary)" }}>
              {m.hintLevel}
            </span>
          )}
          {m.wasRedirected && (
            <span className="px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5"
              style={{ background: "rgba(245,158,11,0.15)", color: "var(--color-warning)" }}>
              <AlertCircle size={9} /> redirected
            </span>
          )}
          {m.safeCategory && m.safeCategory !== "ACADEMIC" && (
            <span className="px-1.5 py-0.5 rounded text-[10px]"
              style={{ background: "var(--color-surface-2)" }}>
              {m.safeCategory.toLowerCase()}
            </span>
          )}
        </div>
        <span>{new Date(m.createdAt).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}</span>
      </div>
      {m.imageUrl && (
        <img src={m.imageUrl} alt="attachment" className="max-w-full rounded-lg mb-2 max-h-60 object-contain" />
      )}
      <p className="text-sm whitespace-pre-wrap break-words" style={{ color: "var(--color-text-primary)" }}>
        {m.content}
      </p>
      {(m.modelUsed || m.tokensUsed || (m.ragSources && m.ragSources.length > 0)) && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t flex-wrap text-[10px]"
          style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-muted)" }}>
          {m.modelUsed && <span className="flex items-center gap-1"><Zap size={9} /> {m.modelUsed}</span>}
          {m.tokensUsed != null && <span>{m.tokensUsed} tokens</span>}
          {m.ragSources && m.ragSources.length > 0 && (
            <span title={m.ragSources.join(", ")}>📚 {m.ragSources.length} sources</span>
          )}
        </div>
      )}
    </div>
  );
}
