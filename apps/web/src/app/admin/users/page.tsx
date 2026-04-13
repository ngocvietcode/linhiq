"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Search, Filter, UserPlus, MoreHorizontal, Ban, Trash2,
  Shield, GraduationCap, Users2, ChevronDown, ChevronUp,
  Check, X, Mail, Eye, RefreshCw
} from "lucide-react";
import type { AdminUser } from "@/lib/admin-api";

type SortKey = "name" | "email" | "createdAt" | "role";
type SortDir = "asc" | "desc";

const ROLE_COLORS: Record<string, { bg: string; color: string; icon: React.FC<{ size: number }> }> = {
  ADMIN:   { bg: "rgba(244,63,94,0.1)",  color: "#F43F5E",  icon: Shield },
  STUDENT: { bg: "rgba(99,102,241,0.1)", color: "#6366F1",  icon: GraduationCap },
  PARENT:  { bg: "rgba(34,211,163,0.1)", color: "#22D3A3",  icon: Users2 },
};

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [actionUser, setActionUser] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api<{ data: AdminUser[] }>("/admin/users", { token });
      setUsers(res?.data || []);
    } catch {
      showToast("Failed to load users", "err");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = users
    .filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.email.toLowerCase().includes(q) ||
          (u.name || "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let va: string = (a as any)[sortKey] || "";
      let vb: string = (b as any)[sortKey] || "";
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function banUser(id: string) {
    if (!token) return;
    try {
      await api(`/admin/users/${id}/ban`, { method: "POST", token });
      showToast("User banned");
      load();
    } catch (e: any) {
      showToast(e.message, "err");
    } finally {
      setActionUser(null);
    }
  }

  async function deleteUser(id: string) {
    if (!token || !confirm("Permanently delete this user? This cannot be undone.")) return;
    try {
      await api(`/admin/users/${id}`, { method: "DELETE", token });
      showToast("User deleted");
      load();
    } catch (e: any) {
      showToast(e.message, "err");
    }
  }

  async function updateRole() {
    if (!token || !editUser || !editRole) return;
    setSaving(true);
    try {
      await api(`/admin/users/${editUser.id}`, { method: "PATCH", token, body: { role: editRole } });
      showToast("Role updated");
      setEditUser(null);
      load();
    } catch (e: any) {
      showToast(e.message, "err");
    } finally {
      setSaving(false);
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === "asc"
      ? <ChevronUp size={12} style={{ color: "var(--color-accent)" }} />
      : <ChevronDown size={12} style={{ color: "var(--color-accent)" }} />;
  }

  const countByRole = (role: string) => users.filter((u) => u.role === role).length;

  return (
    <div className="px-6 lg:px-8 py-8 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-slide-in-right"
          style={{
            background: toast.type === "ok" ? "rgba(34,211,163,0.15)" : "rgba(244,63,94,0.15)",
            border: `1px solid ${toast.type === "ok" ? "rgba(34,211,163,0.4)" : "rgba(244,63,94,0.4)"}`,
            color: toast.type === "ok" ? "var(--color-success)" : "var(--color-danger)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {toast.type === "ok" ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Edit role modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-sm animate-fade-up"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border-default)" }}>
            <h2 className="font-bold text-lg mb-1">Change Role</h2>
            <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
              Changing role for <strong>{editUser.name || editUser.email}</strong>
            </p>
            <div className="space-y-2 mb-5">
              {["STUDENT", "ADMIN", "PARENT"].map((r) => {
                const { bg, color } = ROLE_COLORS[r];
                return (
                  <button
                    key={r}
                    onClick={() => setEditRole(r)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
                    style={{
                      background: editRole === r ? bg : "var(--color-elevated)",
                      borderColor: editRole === r ? color : "var(--color-border-subtle)",
                      color: editRole === r ? color : "var(--color-text-primary)",
                    }}
                  >
                    {r}
                    {editRole === r && <Check size={14} />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditUser(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={updateRole} disabled={saving || !editRole} className="btn-primary flex-1">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            {users.length} total · {countByRole("STUDENT")} students · {countByRole("ADMIN")} admins · {countByRole("PARENT")} parents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost p-2" title="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="btn-primary gap-1.5 text-sm px-4 py-2">
            <UserPlus size={15} /> Invite User
          </button>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 mb-5">
        {["ALL", "STUDENT", "ADMIN", "PARENT"].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
            style={{
              background: roleFilter === r ? "var(--color-accent-soft)" : "var(--color-surface)",
              borderColor: roleFilter === r ? "var(--color-accent)" : "var(--color-border-subtle)",
              color: roleFilter === r ? "var(--color-accent)" : "var(--color-text-secondary)",
            }}
          >
            {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
            <span className="ml-1.5 text-xs opacity-60">
              {r === "ALL" ? users.length : countByRole(r)}
            </span>
          </button>
        ))}
      </div>

      {/* Tools bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-9 text-sm"
            style={{ height: 38 }}
          />
        </div>
        {selectedIds.size > 0 && (
          <button
            className="btn-ghost text-sm px-3 gap-1.5"
            style={{ color: "var(--color-danger)", borderColor: "rgba(244,63,94,0.3)" }}
          >
            <Trash2 size={14} /> Delete {selectedIds.size}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}>
        {/* Table head */}
        <div
          className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "36px 1fr 1fr 120px 120px 80px",
            background: "var(--color-elevated)",
            color: "var(--color-text-muted)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <div>
            <input
              type="checkbox"
              onChange={(e) => setSelectedIds(e.target.checked ? new Set(filtered.map((u) => u.id)) : new Set())}
              className="rounded"
            />
          </div>
          {(["name", "email", "role", "createdAt"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => handleSort(k)}
              className="flex items-center gap-1 hover:text-left w-full"
              style={{ color: "inherit" }}
            >
              {k === "createdAt" ? "Joined" : k.charAt(0).toUpperCase() + k.slice(1)}
              <SortIcon k={k} />
            </button>
          ))}
          <div className="text-right">Actions</div>
        </div>

        {/* Rows */}
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid px-5 py-4 border-b items-center gap-4"
                style={{ gridTemplateColumns: "36px 1fr 1fr 120px 120px 80px", borderColor: "var(--color-border-subtle)" }}>
                <div className="skeleton w-5 h-5 rounded" />
                <div className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="skeleton h-3.5 w-28 rounded" />
                </div>
                <div className="skeleton h-3.5 w-40 rounded" />
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-3.5 w-20 rounded" />
                <div />
              </div>
            ))
          : filtered.length === 0
          ? (
              <div className="py-20 text-center" style={{ color: "var(--color-text-muted)" }}>
                No users found
              </div>
            )
          : filtered.map((u) => {
              const { bg, color, icon: RoleIcon } = ROLE_COLORS[u.role] || ROLE_COLORS.STUDENT;
              return (
                <div
                  key={u.id}
                  className="grid px-5 py-3.5 border-b items-center transition-colors"
                  style={{
                    gridTemplateColumns: "36px 1fr 1fr 120px 120px 80px",
                    borderColor: "var(--color-border-subtle)",
                    background: selectedIds.has(u.id) ? "rgba(99,102,241,0.04)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedIds.has(u.id))
                      (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.025)";
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedIds.has(u.id))
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {/* Select */}
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      className="rounded"
                    />
                  </div>
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: bg, color }}
                    >
                      {(u.name || u.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name || "(No name)"}</p>
                      {u.studentProfile && (
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          🔥 {u.studentProfile.streakDays}d · {Math.floor((u.studentProfile.studyTimeMin || 0) / 60)}h studied
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Email */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail size={12} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                    <span className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>{u.email}</span>
                  </div>
                  {/* Role */}
                  <div>
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: bg, color }}
                    >
                      <RoleIcon size={11} />
                      {u.role}
                    </span>
                  </div>
                  {/* Joined */}
                  <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                  </div>
                  {/* Actions */}
                  <div className="relative flex justify-end">
                    <button
                      onClick={() => setActionUser(actionUser === u.id ? null : u.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--color-text-muted)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {actionUser === u.id && (
                      <div
                        className="absolute right-0 top-8 w-44 rounded-xl border z-20 py-1 animate-fade-up"
                        style={{
                          background: "var(--color-elevated)",
                          borderColor: "var(--color-border-default)",
                          boxShadow: "var(--shadow-md)",
                        }}
                      >
                        <button
                          onClick={() => { setEditUser(u); setEditRole(u.role); setActionUser(null); }}
                          className="flex items-center gap-2.5 px-4 py-2 w-full text-sm transition-colors"
                          style={{ color: "var(--color-text-secondary)" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                        >
                          <Shield size={13} /> Change Role
                        </button>
                        <button
                          className="flex items-center gap-2.5 px-4 py-2 w-full text-sm transition-colors"
                          style={{ color: "var(--color-text-secondary)" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.06)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                          onClick={() => { banUser(u.id); }}
                        >
                          <Ban size={13} /> Ban User
                        </button>
                        <div className="h-px my-1" style={{ background: "var(--color-border-subtle)" }} />
                        <button
                          onClick={() => { deleteUser(u.id); setActionUser(null); }}
                          className="flex items-center gap-2.5 px-4 py-2 w-full text-sm"
                          style={{ color: "var(--color-danger)" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.06)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Footer count */}
      {!loading && (
        <p className="text-xs mt-3 text-right" style={{ color: "var(--color-text-muted)" }}>
          Showing {filtered.length} of {users.length} users
        </p>
      )}
    </div>
  );
}
