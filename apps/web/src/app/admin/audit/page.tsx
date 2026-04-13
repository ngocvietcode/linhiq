"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Shield, Search, Filter, ExternalLink, RefreshCw,
  User, Settings, Trash2, BookOpen, Lock, Globe
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorId: string;
  actorEmail: string;
  details: Record<string, any> | null;
  createdAt: string;
  ipAddress: string | null;
}

// Simulated audit logs (replace with real API when /admin/audit endpoint is ready)
function getMockedLogs(userEmail: string): AuditLog[] {
  const now = new Date();
  const mkDate = (minutesAgo: number) =>
    new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString();

  return [
    { id: "1", action: "USER_ROLE_CHANGED",  entity: "User",    entityId: "u1", actorId: "a1", actorEmail: userEmail, details: { from: "STUDENT", to: "ADMIN" }, createdAt: mkDate(5),    ipAddress: "127.0.0.1" },
    { id: "2", action: "SUBJECT_CREATED",    entity: "Subject", entityId: "s1", actorId: "a1", actorEmail: userEmail, details: { name: "Biology" },               createdAt: mkDate(20),   ipAddress: "127.0.0.1" },
    { id: "3", action: "SUBJECT_UPDATED",    entity: "Subject", entityId: "s2", actorId: "a1", actorEmail: userEmail, details: { name: "Chemistry" },              createdAt: mkDate(65),   ipAddress: "127.0.0.1" },
    { id: "4", action: "PROVIDER_CHANGED",   entity: "Setting", entityId: null, actorId: "a1", actorEmail: userEmail, details: { from: "openai", to: "gemini" },   createdAt: mkDate(120),  ipAddress: "127.0.0.1" },
    { id: "5", action: "USER_BANNED",        entity: "User",    entityId: "u2", actorId: "a1", actorEmail: userEmail, details: { reason: "Inappropriate use" },     createdAt: mkDate(300),  ipAddress: "127.0.0.1" },
    { id: "6", action: "DOCUMENT_DELETED",   entity: "Doc",     entityId: "d1", actorId: "a1", actorEmail: userEmail, details: { title: "IGCSE Biology v1" },       createdAt: mkDate(720),  ipAddress: "127.0.0.1" },
    { id: "7", action: "SETTINGS_RESET",     entity: "Setting", entityId: null, actorId: "a1", actorEmail: userEmail, details: {},                                  createdAt: mkDate(1440), ipAddress: "127.0.0.1" },
    { id: "8", action: "USER_DELETED",       entity: "User",    entityId: "u5", actorId: "a1", actorEmail: userEmail, details: { email: "test@example.com" },        createdAt: mkDate(2880), ipAddress: "127.0.0.1" },
  ];
}

const ACTION_META: Record<string, { color: string; icon: React.FC<{ size: number }>; label: string }> = {
  USER_ROLE_CHANGED: { color: "#6366F1", icon: User,     label: "Role Changed" },
  USER_BANNED:       { color: "#F59E0B", icon: Lock,     label: "User Banned" },
  USER_DELETED:      { color: "#F43F5E", icon: Trash2,   label: "User Deleted" },
  SUBJECT_CREATED:   { color: "#22D3A3", icon: BookOpen, label: "Subject Created" },
  SUBJECT_UPDATED:   { color: "#818CF8", icon: BookOpen, label: "Subject Updated" },
  DOCUMENT_DELETED:  { color: "#F43F5E", icon: Trash2,   label: "Document Deleted" },
  PROVIDER_CHANGED:  { color: "#F59E0B", icon: Globe,    label: "Provider Changed" },
  SETTINGS_RESET:    { color: "#F43F5E", icon: Settings, label: "Settings Reset" },
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminAuditPage() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    // Artificial delay to simulate fetch
    await new Promise((r) => setTimeout(r, 500));
    setLogs(getMockedLogs(user?.email || "admin@linhiq.com"));
    setLoading(false);
  }, [token, user]);

  useEffect(() => { load(); }, [load]);

  const categories = ["ALL", "USER", "SUBJECT", "SETTING", "DOC"];

  const filtered = logs.filter((l) => {
    if (filter !== "ALL" && !l.entity.toUpperCase().startsWith(filter === "DOC" ? "DOC" : filter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.actorEmail.toLowerCase().includes(q) ||
        (l.entityId || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="px-6 lg:px-8 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={22} style={{ color: "var(--color-accent)" }} />
            Audit Logs
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            All administrative actions are recorded here
          </p>
        </div>
        <button onClick={load} className="btn-ghost p-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
            style={{
              background: filter === c ? "var(--color-accent-soft)" : "var(--color-surface)",
              borderColor: filter === c ? "var(--color-accent)" : "var(--color-border-subtle)",
              color: filter === c ? "var(--color-accent)" : "var(--color-text-secondary)",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search action, actor, entity..."
          className="input pl-9 text-sm"
          style={{ height: 38 }}
        />
      </div>

      {/* Log list */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 border-b"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-72 rounded" />
              </div>
              <div className="skeleton h-3 w-16 rounded" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--color-text-muted)" }}>
            No audit logs found
          </div>
        ) : (
          filtered.map((log, i) => {
            const meta = ACTION_META[log.action] || { color: "#6366F1", icon: Shield, label: log.action };
            const Icon = meta.icon;
            const isExpanded = expanded === log.id;

            return (
              <div
                key={log.id}
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : log.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.025)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                  }
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${meta.color}18` }}
                  >
                    <span style={{ color: meta.color }}><Icon size={14} /></span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${meta.color}18`, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-sm font-mono" style={{ color: "var(--color-text-secondary)" }}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      by <strong style={{ color: "var(--color-text-secondary)" }}>{log.actorEmail}</strong>
                      {log.entityId && (
                        <> · entity: <code className="font-mono text-[10px]">{log.entityId.slice(0, 12)}…</code></>
                      )}
                      {log.ipAddress && (
                        <> · IP: {log.ipAddress}</>
                      )}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>
                    {timeAgo(log.createdAt)}
                  </span>
                </button>

                {/* Expanded details */}
                {isExpanded && log.details && Object.keys(log.details).length > 0 && (
                  <div
                    className="px-5 pb-4 ml-12"
                    style={{ borderTop: "1px solid var(--color-border-subtle)" }}
                  >
                    <div
                      className="mt-3 rounded-xl p-3 text-xs font-mono"
                      style={{ background: "var(--color-elevated)", color: "var(--color-text-secondary)" }}
                    >
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                    <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
                      Full timestamp: {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs mt-3 text-right" style={{ color: "var(--color-text-muted)" }}>
        Showing {filtered.length} of {logs.length} events
      </p>
    </div>
  );
}
