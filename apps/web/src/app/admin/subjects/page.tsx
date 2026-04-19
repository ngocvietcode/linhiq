"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Plus, Search, Edit2, Trash2, BookOpen, ChevronRight,
  MoreHorizontal, RefreshCw, Check, X, AlertCircle, FileText
} from "lucide-react";
import Link from "next/link";
import type { AdminSubject, CreateSubjectBody } from "@/lib/admin-api";

const CURRICULUM_OPTIONS = [
  { value: "IGCSE",       label: "IGCSE" },
  { value: "A_LEVEL",     label: "A-Level" },
  { value: "VN_GRADE_12", label: "VN Grade 12" },
  { value: "GENERAL",     label: "General" },
];

const CURRICULUM_COLOR: Record<string, { bg: string; color: string }> = {
  IGCSE:       { bg: "rgba(218,119,86,0.12)",  color: "var(--color-accent)" },
  A_LEVEL:     { bg: "rgba(34,211,163,0.12)",  color: "#22D3A3" },
  VN_GRADE_12: { bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
  GENERAL:     { bg: "rgba(148,163,184,0.12)", color: "#94A3B8" },
};

const EMPTY: CreateSubjectBody = { name: "", curriculum: "IGCSE", description: "", iconEmoji: "📚" };

export default function AdminSubjectsPage() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCurr, setFilterCurr] = useState("ALL");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<AdminSubject | null>(null);
  const [form, setForm] = useState<CreateSubjectBody>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminSubject | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api<{ data: AdminSubject[] }>("/admin/subjects", { token });
      setSubjects(res?.data || []);
    } catch {
      showToast("Failed to load subjects", "err");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = subjects.filter((s) => {
    if (filterCurr !== "ALL" && s.curriculum !== filterCurr) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openCreate() {
    setForm(EMPTY);
    setSelected(null);
    setModal("create");
  }

  function openEdit(s: AdminSubject) {
    setSelected(s);
    setForm({
      name: s.name,
      curriculum: s.curriculum as CreateSubjectBody["curriculum"],
      description: s.description || "",
      iconEmoji: s.iconEmoji,
    });
    setModal("edit");
    setActionId(null);
  }

  async function handleSave() {
    if (!token) return;
    if (!form.name.trim()) { showToast("Name is required", "err"); return; }
    setSaving(true);
    try {
      if (modal === "create") {
        await api("/admin/subjects", { method: "POST", token, body: form });
        showToast("Subject created");
      } else if (selected) {
        await api(`/admin/subjects/${selected.id}`, { method: "PUT", token, body: form });
        showToast("Subject updated");
      }
      setModal(null);
      load();
    } catch (e: any) {
      showToast(e.message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: AdminSubject) {
    if (!token) return;
    try {
      await api(`/admin/subjects/${s.id}`, { method: "DELETE", token });
      showToast("Subject deleted");
      setDeleteConfirm(null);
      load();
    } catch (e: any) {
      showToast(e.message, "err");
    }
  }

  const EMOJIS = ["📚", "🧬", "⚗️", "∫", "🌍", "💻", "📐", "🔭", "🎨", "📝", "🔬", "🎵"];

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

      {/* Subject form modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border animate-fade-up"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border-default)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
              <h2 className="font-bold text-lg">{modal === "create" ? "Create Subject" : "Edit Subject"}</h2>
              <button onClick={() => setModal(null)} style={{ color: "var(--color-text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Emoji picker */}
              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setForm({ ...form, iconEmoji: e })}
                      className="w-10 h-10 text-xl rounded-xl border transition-all"
                      style={{
                        background: form.iconEmoji === e ? "var(--color-accent-soft)" : "var(--color-elevated)",
                        borderColor: form.iconEmoji === e ? "var(--color-accent)" : "transparent",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Subject Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input mt-1.5"
                  placeholder="e.g. Biology, Mathematics..."
                />
              </div>
              <div>
                <label className="label">Curriculum *</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {CURRICULUM_OPTIONS.map(({ value, label }) => {
                    const { bg, color } = CURRICULUM_COLOR[value];
                    return (
                      <button
                        key={value}
                        onClick={() => setForm({ ...form, curriculum: value as CreateSubjectBody["curriculum"] })}
                        className="px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left"
                        style={{
                          background: form.curriculum === value ? bg : "var(--color-elevated)",
                          borderColor: form.curriculum === value ? color : "var(--color-border-subtle)",
                          color: form.curriculum === value ? color : "var(--color-text-secondary)",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input mt-1.5 resize-none"
                  rows={3}
                  placeholder="Briefly describe this subject..."
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? "Saving..." : modal === "create" ? "Create" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div className="rounded-2xl border p-6 w-full max-w-sm animate-fade-up"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border-default)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(244,63,94,0.1)" }}>
              <AlertCircle size={22} style={{ color: "var(--color-danger)" }} />
            </div>
            <h2 className="font-bold text-lg mb-1">Delete Subject?</h2>
            <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
              This will permanently delete <strong>{deleteConfirm.name}</strong> and all its documents, topics, and chunks. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1">Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn-primary flex-1"
                style={{ background: "var(--color-danger)", boxShadow: "none" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subjects & Books</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} in the knowledge base
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost p-2" title="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={openCreate} className="btn-primary gap-1.5 text-sm px-4 py-2">
            <Plus size={15} /> New Subject
          </button>
        </div>
      </div>

      {/* Curriculum filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["ALL", ...CURRICULUM_OPTIONS.map((c) => c.value)].map((c) => {
          const label = c === "ALL" ? "All" : CURRICULUM_OPTIONS.find((o) => o.value === c)?.label || c;
          const { color } = CURRICULUM_COLOR[c] || { color: "var(--color-text-secondary)" };
          const count = c === "ALL" ? subjects.length : subjects.filter((s) => s.curriculum === c).length;
          return (
            <button
              key={c}
              onClick={() => setFilterCurr(c)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
              style={{
                background: filterCurr === c ? (c === "ALL" ? "var(--color-accent-soft)" : `${color}18`) : "var(--color-surface)",
                borderColor: filterCurr === c ? (c === "ALL" ? "var(--color-accent)" : color) : "var(--color-border-subtle)",
                color: filterCurr === c ? (c === "ALL" ? "var(--color-accent)" : color) : "var(--color-text-secondary)",
              }}
            >
              {label} <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects..."
          className="input pl-9 text-sm"
          style={{ height: 38 }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-5"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="skeleton w-20 h-5 rounded-full" />
              </div>
              <div className="skeleton h-5 w-32 rounded mb-2" />
              <div className="skeleton h-3.5 w-48 rounded mb-4" />
              <div className="flex gap-3">
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-4 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
          <p style={{ color: "var(--color-text-muted)" }}>No subjects found</p>
          <button onClick={openCreate} className="btn-primary mt-4 text-sm">Create First Subject</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const { bg, color } = CURRICULUM_COLOR[s.curriculum] || CURRICULUM_COLOR.GENERAL;
            return (
              <div
                key={s.id}
                className="rounded-2xl border p-5 relative group transition-all duration-200"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = `${color}40`;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = `0 4px 20px ${color}10`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--color-border-subtle)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Actions menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setActionId(actionId === s.id ? null : s.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: "var(--color-text-muted)", background: "var(--color-elevated)" }}
                  >
                    <MoreHorizontal size={15} />
                  </button>
                  {actionId === s.id && (
                    <div
                      className="absolute right-0 top-8 w-40 rounded-xl border z-20 py-1 animate-fade-up"
                      style={{
                        background: "var(--color-elevated)",
                        borderColor: "var(--color-border-default)",
                        boxShadow: "var(--shadow-md)",
                      }}
                    >
                      <button
                        onClick={() => openEdit(s)}
                        className="flex items-center gap-2.5 px-4 py-2 w-full text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(218,119,86,0.06)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <Link
                        href={`/admin/subjects/${s.id}`}
                        className="flex items-center gap-2.5 px-4 py-2 w-full text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(218,119,86,0.06)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                      >
                        <FileText size={13} /> View Detail
                      </Link>
                      <div className="h-px my-1" style={{ background: "var(--color-border-subtle)" }} />
                      <button
                        onClick={() => { setDeleteConfirm(s); setActionId(null); }}
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

                <div className="flex items-start gap-3 mb-4 pr-10">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: bg }}
                  >
                    {s.iconEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.name}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                      style={{ background: bg, color }}
                    >
                      {CURRICULUM_OPTIONS.find((o) => o.value === s.curriculum)?.label || s.curriculum}
                    </span>
                  </div>
                </div>

                {s.description && (
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                    {s.description}
                  </p>
                )}

                <div
                  className="flex items-center gap-4 pt-4 border-t text-xs"
                  style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-muted)" }}
                >
                  <span className="flex items-center gap-1">
                    <FileText size={11} /> {s._count.documents} docs
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={11} /> {s._count.topics} topics
                  </span>
                  <Link
                    href={`/admin/subjects/${s.id}`}
                    className="ml-auto flex items-center gap-1 font-medium"
                    style={{ color }}
                  >
                    View <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
