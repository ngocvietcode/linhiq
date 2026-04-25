"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  adminUsers,
  type AdminUser,
  type AdminUserDetail,
  type AdminUsersListResponse,
  type UserRole,
} from "@/lib/admin-api";
import {
  Search, UserPlus, MoreHorizontal, Ban, Trash2, Shield, GraduationCap,
  Users2, ChevronDown, ChevronUp, Check, X, Mail, Eye, RefreshCw,
  KeyRound, Copy, ChevronLeft, ChevronRight, Unlock, AlertTriangle,
} from "lucide-react";

type SortKey = "name" | "email" | "createdAt" | "role";
type SortDir = "asc" | "desc";

const ROLE_COLORS: Record<UserRole, { bg: string; color: string; icon: React.FC<{ size: number }> }> = {
  ADMIN:   { bg: "rgba(244,63,94,0.1)",      color: "#F43F5E",                icon: Shield },
  STUDENT: { bg: "var(--color-accent-soft)", color: "var(--color-accent)",    icon: GraduationCap },
  PARENT:  { bg: "rgba(34,211,163,0.1)",     color: "var(--color-teal)",      icon: Users2 },
};

const ROLES: UserRole[] = ["STUDENT", "ADMIN", "PARENT"];

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // ── URL-synced state ────────────────────
  const search = sp.get("q") || "";
  const roleFilter = (sp.get("role") || "ALL") as UserRole | "ALL";
  const status = (sp.get("status") || "all") as "active" | "banned" | "all";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = 25;
  const sortKey = (sp.get("sortBy") || "createdAt") as SortKey;
  const sortDir = (sp.get("sortDir") || "desc") as SortDir;

  const setParam = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    router.replace(`${pathname}?${next.toString()}`);
  }, [sp, router, pathname]);

  // ── Fetch state ─────────────────────────
  const [resp, setResp] = useState<AdminUsersListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("STUDENT");
  const [showInvite, setShowInvite] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; body: string; danger?: boolean; onOk: () => void } | null>(null);
  const [tempPassword, setTempPassword] = useState<{ user: string; password: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await adminUsers.list(token, {
        q: search || undefined,
        role: roleFilter === "ALL" ? undefined : roleFilter,
        status,
        page,
        pageSize,
        sortBy: sortKey,
        sortDir,
      });
      setResp(r);
    } catch (e: any) {
      showToast(e.message || "Failed to load users", "err");
    } finally {
      setLoading(false);
    }
  }, [token, search, roleFilter, status, page, sortKey, sortDir]);

  useEffect(() => { load(); }, [load]);

  // Reset selection when page/filter changes
  useEffect(() => { setSelectedIds(new Set()); }, [page, search, roleFilter, status]);

  // ── Handlers ────────────────────────────
  function handleSort(key: SortKey) {
    if (sortKey === key) setParam({ sortDir: sortDir === "asc" ? "desc" : "asc", page: "1" });
    else setParam({ sortBy: key, sortDir: "asc", page: "1" });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function ban(u: AdminUser) {
    if (!token) return;
    try {
      await adminUsers.ban(token, u.id);
      showToast(`Banned ${u.name || u.email}`);
      load();
    } catch (e: any) { showToast(e.message, "err"); }
    finally { setActionUser(null); }
  }

  async function unban(u: AdminUser) {
    if (!token) return;
    try {
      await adminUsers.unban(token, u.id);
      showToast(`Unbanned ${u.name || u.email}`);
      load();
    } catch (e: any) { showToast(e.message, "err"); }
    finally { setActionUser(null); }
  }

  async function deleteUser(u: AdminUser) {
    if (!token) return;
    setConfirm({
      title: "Delete user?",
      body: `Permanently delete ${u.name || u.email}. This cannot be undone — all their chat sessions, quizzes, and progress will be removed.`,
      danger: true,
      onOk: async () => {
        try {
          await adminUsers.delete(token, u.id);
          showToast("User deleted");
          load();
        } catch (e: any) { showToast(e.message, "err"); }
        finally { setConfirm(null); setActionUser(null); }
      },
    });
  }

  async function bulkDelete() {
    if (!token || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setConfirm({
      title: `Delete ${ids.length} users?`,
      body: "All selected users and their data will be permanently removed. Your own account will be skipped automatically.",
      danger: true,
      onOk: async () => {
        try {
          const r = await adminUsers.bulkDelete(token, ids);
          showToast(`Deleted ${r.data.deleted} user(s)${r.data.skipped ? `, skipped ${r.data.skipped}` : ""}`);
          setSelectedIds(new Set());
          load();
        } catch (e: any) { showToast(e.message, "err"); }
        finally { setConfirm(null); }
      },
    });
  }

  async function updateRole() {
    if (!token || !editUser) return;
    setSaving(true);
    try {
      await adminUsers.update(token, editUser.id, { role: editRole, name: editUser.name || "", email: editUser.email });
      showToast("Role updated");
      setEditUser(null);
      load();
    } catch (e: any) { showToast(e.message, "err"); }
    finally { setSaving(false); }
  }

  async function resetPassword(u: AdminUser) {
    if (!token) return;
    setConfirm({
      title: "Reset password?",
      body: `Generate a new temporary password for ${u.name || u.email}. They will need it to sign in.`,
      onOk: async () => {
        try {
          const r = await adminUsers.resetPassword(token, u.id);
          setTempPassword({ user: u.email, password: r.data.tempPassword });
          showToast("Password reset");
        } catch (e: any) { showToast(e.message, "err"); }
        finally { setConfirm(null); setActionUser(null); }
      },
    });
  }

  // ── Derived ─────────────────────────────
  const users = resp?.data || [];
  const counts = resp?.counts || { all: 0, STUDENT: 0, ADMIN: 0, PARENT: 0 };
  const totalPages = resp?.pagination.totalPages || 1;
  const total = resp?.pagination.total || 0;

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === "asc"
      ? <ChevronUp size={12} style={{ color: "var(--color-accent)" }} />
      : <ChevronDown size={12} style={{ color: "var(--color-accent)" }} />;
  }

  return (
    <div className="px-6 lg:px-8 py-8 max-w-6xl mx-auto">
      {toast && <Toast {...toast} />}

      {tempPassword && (
        <TempPasswordModal data={tempPassword} onClose={() => setTempPassword(null)} />
      )}

      {confirm && (
        <ConfirmModal
          {...confirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {showInvite && token && (
        <InviteUserModal
          token={token}
          onClose={() => setShowInvite(false)}
          onCreated={() => { setShowInvite(false); load(); showToast("User created"); }}
          onError={(m) => showToast(m, "err")}
        />
      )}

      {detailId && token && (
        <UserDetailDrawer
          id={detailId}
          token={token}
          onClose={() => setDetailId(null)}
          onResetPassword={async (u) => { setDetailId(null); await resetPassword(u); }}
        />
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-sm animate-fade-up"
            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-default)" }}>
            <h2 className="font-bold text-lg mb-1">Change Role</h2>
            <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
              Changing role for <strong>{editUser.name || editUser.email}</strong>
            </p>
            <div className="space-y-2 mb-5">
              {ROLES.map((r) => {
                const { bg, color } = ROLE_COLORS[r];
                const disabled = editUser.id === me?.id && r !== "ADMIN";
                return (
                  <button
                    key={r}
                    disabled={disabled}
                    onClick={() => setEditRole(r)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: editRole === r ? bg : "var(--color-surface-0)",
                      borderColor: editRole === r ? color : "var(--color-border-subtle)",
                      color: editRole === r ? color : "var(--color-text-primary)",
                    }}
                  >
                    {r}
                    {editRole === r && <Check size={14} />}
                    {disabled && <span className="text-xs ml-auto opacity-60">can't demote self</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditUser(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={updateRole} disabled={saving || !editRole || editRole === editUser.role} className="btn-primary flex-1">
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
            {counts.all} total · {counts.STUDENT} students · {counts.ADMIN} admins · {counts.PARENT} parents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost p-2" title="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowInvite(true)} className="btn-primary gap-1.5 text-sm px-4 py-2">
            <UserPlus size={15} /> New User
          </button>
        </div>
      </div>

      {/* Role + status tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(["ALL", ...ROLES] as const).map((r) => {
          const c = r === "ALL" ? counts.all : counts[r as UserRole];
          return (
            <button
              key={r}
              onClick={() => setParam({ role: r === "ALL" ? null : r, page: "1" })}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
              style={{
                background: roleFilter === r ? "var(--color-accent-soft)" : "var(--color-surface-2)",
                borderColor: roleFilter === r ? "var(--color-accent)" : "var(--color-border-subtle)",
                color: roleFilter === r ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
              <span className="ml-1.5 text-xs opacity-60">{c}</span>
            </button>
          );
        })}

        <div className="ml-2 flex gap-1 p-1 rounded-lg border" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-surface-2)" }}>
          {(["all", "active", "banned"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setParam({ status: s === "all" ? null : s, page: "1" })}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                background: status === s ? "var(--color-accent)" : "transparent",
                color: status === s ? "white" : "var(--color-text-secondary)",
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tools bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setParam({ q: e.target.value || null, page: "1" })}
            placeholder="Search by name or email..."
            className="input pl-9 text-sm"
            style={{ height: 38 }}
          />
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={bulkDelete}
            className="btn-ghost text-sm px-3 gap-1.5"
            style={{ color: "var(--color-danger)", borderColor: "rgba(244,63,94,0.3)" }}
          >
            <Trash2 size={14} /> Delete {selectedIds.size}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}>
        <div
          className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "36px 1fr 1fr 130px 120px 80px",
            background: "var(--color-surface-0)",
            color: "var(--color-text-muted)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <div>
            <input
              type="checkbox"
              checked={selectedIds.size > 0 && selectedIds.size === users.length}
              onChange={(e) => setSelectedIds(e.target.checked ? new Set(users.map((u) => u.id)) : new Set())}
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

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid px-5 py-4 border-b items-center gap-4"
              style={{ gridTemplateColumns: "36px 1fr 1fr 130px 120px 80px", borderColor: "var(--color-border-subtle)" }}>
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
        ) : users.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--color-text-muted)" }}>
            No users found
          </div>
        ) : users.map((u) => {
          const { bg, color, icon: RoleIcon } = ROLE_COLORS[u.role] || ROLE_COLORS.STUDENT;
          const isMe = u.id === me?.id;
          return (
            <div
              key={u.id}
              className="grid px-5 py-3.5 border-b items-center transition-colors group"
              style={{
                gridTemplateColumns: "36px 1fr 1fr 130px 120px 80px",
                borderColor: "var(--color-border-subtle)",
                background: selectedIds.has(u.id) ? "var(--color-accent-soft)" : "transparent",
                opacity: u.isActive ? 1 : 0.62,
              }}
              onMouseEnter={(e) => { if (!selectedIds.has(u.id)) (e.currentTarget as HTMLElement).style.background = "var(--color-accent-soft)"; }}
              onMouseLeave={(e) => { if (!selectedIds.has(u.id)) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selectedIds.has(u.id)}
                  onChange={() => toggleSelect(u.id)}
                  disabled={isMe}
                  className="rounded"
                />
              </div>
              <button
                onClick={() => setDetailId(u.id)}
                className="flex items-center gap-3 min-w-0 text-left"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: bg, color }}>
                  {(u.name || u.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5">
                    {u.name || "(No name)"}
                    {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>you</span>}
                  </p>
                  {u.studentProfile && (
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      🔥 {u.studentProfile.streakDays}d · {u._count?.chatSessions || 0} chats
                    </p>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail size={12} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                <span className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>{u.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: bg, color }}>
                  <RoleIcon size={11} />
                  {u.role}
                </span>
                {!u.isActive && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase"
                    style={{ background: "rgba(244,63,94,0.15)", color: "var(--color-danger)" }}>
                    <Ban size={9} /> Banned
                  </span>
                )}
              </div>
              <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
              </div>
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
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActionUser(null)} />
                    <div
                      className="absolute right-0 top-8 w-48 rounded-xl border z-20 py-1 animate-fade-up"
                      style={{
                        background: "var(--color-surface-0)",
                        borderColor: "var(--color-border-default)",
                        boxShadow: "var(--shadow-md)",
                      }}
                    >
                      <MenuItem icon={Eye} label="View Detail" onClick={() => { setDetailId(u.id); setActionUser(null); }} />
                      <MenuItem icon={Shield} label="Change Role" onClick={() => { setEditUser(u); setEditRole(u.role); setActionUser(null); }} />
                      <MenuItem icon={KeyRound} label="Reset Password" onClick={() => resetPassword(u)} />
                      <div className="h-px my-1" style={{ background: "var(--color-border-subtle)" }} />
                      {u.isActive ? (
                        <MenuItem icon={Ban} label="Ban User" disabled={isMe} onClick={() => ban(u)} />
                      ) : (
                        <MenuItem icon={Unlock} label="Unban User" onClick={() => unban(u)} />
                      )}
                      <MenuItem icon={Trash2} label="Delete" danger disabled={isMe} onClick={() => deleteUser(u)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
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

function MenuItem({
  icon: Icon, label, onClick, danger, disabled,
}: { icon: React.FC<{ size: number }>; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2.5 px-4 py-2 w-full text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ color: danger ? "var(--color-danger)" : "var(--color-text-secondary)" }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = danger ? "rgba(244,63,94,0.06)" : "var(--color-accent-soft)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <Icon size={13} /> {label}
    </button>
  );
}

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
  title, body, danger, onOk, onCancel,
}: { title: string; body: string; danger?: boolean; onOk: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="rounded-2xl border p-6 w-full max-w-sm animate-fade-up"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-default)" }}>
        <div className="flex items-start gap-3 mb-3">
          {danger && (
            <div className="p-2 rounded-full flex-shrink-0" style={{ background: "rgba(244,63,94,0.15)" }}>
              <AlertTriangle size={18} style={{ color: "var(--color-danger)" }} />
            </div>
          )}
          <div className="flex-1">
            <h2 className="font-bold text-lg">{title}</h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>{body}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={onOk}
            className="btn-primary flex-1"
            style={danger ? { background: "var(--color-danger)" } : undefined}
          >
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TempPasswordModal({ data, onClose }: { data: { user: string; password: string }; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="rounded-2xl border p-6 w-full max-w-md animate-fade-up"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-default)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <KeyRound size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="font-bold text-lg">New Password</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Share this password with <strong>{data.user}</strong> securely. It will <strong>not be shown again</strong>.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-xl border font-mono text-sm"
          style={{ background: "var(--color-surface-0)", borderColor: "var(--color-border-subtle)" }}>
          <code className="flex-1 truncate">{data.password}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(data.password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="p-1.5 rounded-lg"
            style={{ color: copied ? "var(--color-success)" : "var(--color-text-muted)" }}
            title="Copy"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <button onClick={onClose} className="btn-primary w-full mt-5">Got it</button>
      </div>
    </div>
  );
}

function InviteUserModal({
  token, onClose, onCreated, onError,
}: { token: string; onClose: () => void; onCreated: () => void; onError: (m: string) => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  function generatePw() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let p = "";
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setPassword(p);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminUsers.create(token, { email, name, role, password });
      onCreated();
    } catch (err: any) {
      onError(err.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <form onSubmit={submit} className="rounded-2xl border p-6 w-full max-w-md animate-fade-up"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-default)" }}>
        <h2 className="font-bold text-lg mb-1">New User</h2>
        <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
          Create an account directly. The user can change their password later.
        </p>

        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
          className="input text-sm mb-3" placeholder="user@example.com" />

        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2}
          className="input text-sm mb-3" placeholder="Full name" />

        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Role</label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {ROLES.map((r) => {
            const { bg, color } = ROLE_COLORS[r];
            return (
              <button type="button" key={r} onClick={() => setRole(r)}
                className="px-3 py-2 rounded-lg border text-sm font-medium transition-all"
                style={{
                  background: role === r ? bg : "var(--color-surface-0)",
                  borderColor: role === r ? color : "var(--color-border-subtle)",
                  color: role === r ? color : "var(--color-text-secondary)",
                }}>
                {r}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Password</label>
          <button type="button" onClick={generatePw} className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
            Generate
          </button>
        </div>
        <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
          className="input text-sm font-mono mb-5" placeholder="Min 8 characters" />

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}

function UserDetailDrawer({
  id, token, onClose, onResetPassword,
}: { id: string; token: string; onClose: () => void; onResetPassword: (u: AdminUserDetail) => void }) {
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminUsers.get(token, id).then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id, token]);

  const c = data ? ROLE_COLORS[data.role] : ROLE_COLORS.STUDENT;

  return (
    <div className="fixed inset-0 z-[55] flex justify-end" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div
        className="w-full max-w-md h-full overflow-y-auto border-l animate-slide-in-right"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-default)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg">User Detail</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--color-text-muted)" }}><X size={16} /></button>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-16 rounded-xl" />
              <div className="skeleton h-24 rounded-xl" />
              <div className="skeleton h-24 rounded-xl" />
            </div>
          ) : !data ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-muted)" }}>Failed to load</p>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{ background: c.bg, color: c.color }}>
                  {(data.name || data.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate">{data.name || "(No name)"}</p>
                  <p className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>{data.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: c.bg, color: c.color }}>
                      {data.role}
                    </span>
                    {!data.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase"
                        style={{ background: "rgba(244,63,94,0.15)", color: "var(--color-danger)" }}>Banned</span>
                    )}
                  </div>
                </div>
              </div>

              <Section title="Account">
                <Row label="User ID" value={<code className="text-xs">{data.id}</code>} />
                <Row label="Joined" value={new Date(data.createdAt).toLocaleString()} />
                {data.googleId && <Row label="Google" value="Linked" />}
              </Section>

              {data.studentProfile && (
                <Section title="Student Profile">
                  <Row label="Curriculum" value={data.studentProfile.curriculum} />
                  <Row label="Streak" value={`🔥 ${data.studentProfile.streakDays} days`} />
                  <Row label="Daily goal" value={`${data.studentProfile.studyGoal} min`} />
                  <Row label="Last study" value={data.studentProfile.lastStudyAt ? new Date(data.studentProfile.lastStudyAt).toLocaleDateString() : "—"} />
                  {data.studentProfile.enrollments && data.studentProfile.enrollments.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs mb-1.5" style={{ color: "var(--color-text-muted)" }}>Subjects</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.studentProfile.enrollments.map((e) => (
                          <span key={e.id} className="text-xs px-2 py-1 rounded-md border"
                            style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-surface-0)" }}>
                            {e.subject.iconEmoji} {e.subject.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Section>
              )}

              {data.chatSessions.length > 0 && (
                <Section title={`Recent Sessions (${data.chatSessions.length})`}>
                  <div className="space-y-1.5">
                    {data.chatSessions.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-sm py-1.5">
                        <span className="truncate flex-1">
                          {s.subject ? `${s.subject.iconEmoji} ` : ""}{s.title || "(Untitled)"}
                        </span>
                        <span className="text-xs ml-2" style={{ color: "var(--color-text-muted)" }}>
                          {s._count.messages} msg · {new Date(s.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {(data.parentLinks.length > 0 || data.childLinks.length > 0) && (
                <Section title="Family">
                  {data.parentLinks.map((l) => (
                    <Row key={l.id} label="Child" value={`${l.child.name} (${l.child.email})`} />
                  ))}
                  {data.childLinks.map((l) => (
                    <Row key={l.id} label="Parent" value={`${l.parent.name} (${l.parent.email})`} />
                  ))}
                </Section>
              )}

              <button onClick={() => onResetPassword(data)} className="btn-ghost w-full gap-2 mt-2">
                <KeyRound size={14} /> Reset Password
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>{title}</h3>
      <div className="rounded-xl border p-3" style={{ background: "var(--color-surface-0)", borderColor: "var(--color-border-subtle)" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}
