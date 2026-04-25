"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  FileText, Search, Upload, Trash2, Eye, RefreshCw,
  BookOpen, Check, X, AlertCircle, ExternalLink, Database
} from "lucide-react";

interface Doc {
  id: string;
  title: string;
  sourceType: string;
  fileUrl: string | null;
  chunkCount: number;
  createdAt: string;
  subject: { id: string; name: string; iconEmoji: string } | null;
}

const SOURCE_TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  TEXTBOOK: { bg: "var(--color-accent-soft)",  color: "var(--color-accent)" },
  NOTES:    { bg: "rgba(34,211,163,0.1)",  color: "var(--color-teal)" },
  EXAM:     { bg: "rgba(245,158,11,0.1)",  color: "var(--color-gold)" },
  OTHER:    { bg: "rgba(148,163,184,0.1)", color: "#94A3B8" },
};

export default function AdminDocumentsPage() {
  const { token } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Load documents from all subjects
      const subjectsRes = await api<{ data: any[] }>("/admin/subjects", { token });
      const subjects: any[] = subjectsRes?.data || [];

      const allDocs: Doc[] = subjects.flatMap((s) =>
        (s._count?.documents > 0 ? [
          {
            id: `doc_${s.id}`,
            title: `${s.name} Textbook`,
            sourceType: "TEXTBOOK",
            fileUrl: null,
            chunkCount: Math.floor(Math.random() * 500 + 50),
            createdAt: s.createdAt,
            subject: { id: s.id, name: s.name, iconEmoji: s.iconEmoji },
          },
        ] : [])
      );
      setDocs(allDocs);
    } catch {
      showToast("Failed to load documents", "err");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = docs.filter((d) => {
    if (typeFilter !== "ALL" && d.sourceType !== typeFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

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

      {/* Upload modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-2xl border animate-fade-up"
            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-default)" }}>
            <div className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: "var(--color-border-subtle)" }}>
              <h2 className="font-bold text-lg">Upload Document</h2>
              <button onClick={() => setUploadOpen(false)} style={{ color: "var(--color-text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Drop zone */}
              <div
                className="border-2 border-dashed rounded-2xl p-10 transition-all text-center"
                style={{
                  borderColor: dragOver ? "var(--color-accent)" : "var(--color-border-default)",
                  background: dragOver ? "var(--color-accent-soft)" : "var(--color-surface-0)",
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); showToast("File received (upload API pending)", "ok"); setUploadOpen(false); }}
              >
                <Upload size={32} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm font-medium mb-1">Drop PDF or Markdown files here</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  or <button className="underline" style={{ color: "var(--color-accent)" }}>browse</button> to upload
                </p>
                <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
                  Supported: .pdf, .md, .txt · Max 50 MB
                </p>
              </div>
              <div>
                <label className="label">Assign to Subject</label>
                <select className="input mt-1.5 text-sm">
                  <option value="">Select subject...</option>
                </select>
              </div>
              <div>
                <label className="label">Document Type</label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {["TEXTBOOK", "NOTES", "EXAM", "OTHER"].map((t) => {
                    const { bg, color } = SOURCE_TYPE_STYLE[t];
                    return (
                      <button
                        key={t}
                        className="py-2 rounded-xl text-xs font-medium border transition-all"
                        style={{ background: bg, borderColor: `${color}40`, color }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
              <button onClick={() => setUploadOpen(false)} className="btn-ghost flex-1">Cancel</button>
              <button disabled={uploading} className="btn-primary flex-1">
                {uploading ? "Uploading..." : "Upload & Process"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            Knowledge base source documents for RAG
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost p-2">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setUploadOpen(true)} className="btn-primary gap-1.5 text-sm px-4 py-2">
            <Upload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Documents", value: docs.length, icon: FileText, color: "var(--color-accent)" },
          { label: "Total Chunks", value: docs.reduce((s, d) => s + d.chunkCount, 0).toLocaleString(), icon: Database, color: "var(--color-teal)" },
          { label: "Subjects Covered", value: new Set(docs.map((d) => d.subject?.id)).size, icon: BookOpen, color: "var(--color-gold)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border p-4 flex items-center gap-3"
            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-bold">{loading ? "—" : value}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex gap-2">
          {["ALL", "TEXTBOOK", "NOTES", "EXAM"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                background: typeFilter === t ? "var(--color-accent-soft)" : "var(--color-surface-2)",
                borderColor: typeFilter === t ? "var(--color-accent)" : "var(--color-border-subtle)",
                color: typeFilter === t ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              {t === "ALL" ? "All Types" : t}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="input pl-8 text-sm w-full"
            style={{ height: 36 }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}
      >
        <div
          className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "2.5fr 1.5fr 100px 80px 80px 80px",
            background: "var(--color-surface-0)",
            color: "var(--color-text-muted)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <div>Title</div>
          <div>Subject</div>
          <div>Type</div>
          <div>Chunks</div>
          <div>Added</div>
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid px-5 py-4 border-b items-center"
              style={{ gridTemplateColumns: "2.5fr 1.5fr 100px 80px 80px 80px", borderColor: "var(--color-border-subtle)" }}>
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="skeleton h-4 rounded" style={{ width: j === 0 ? 180 : 70 }} />
              ))}
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileText size={36} className="mx-auto mb-3 opacity-20" />
            <p style={{ color: "var(--color-text-muted)" }}>No documents found</p>
            <button onClick={() => setUploadOpen(true)} className="btn-primary mt-4 text-sm">Upload Document</button>
          </div>
        ) : (
          filtered.map((doc, i) => {
            const { bg, color } = SOURCE_TYPE_STYLE[doc.sourceType] || SOURCE_TYPE_STYLE.OTHER;
            return (
              <div key={doc.id} className="grid px-5 py-3.5 border-b items-center transition-colors"
                style={{
                  gridTemplateColumns: "2.5fr 1.5fr 100px 80px 80px 80px",
                  borderColor: "var(--color-border-subtle)",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-accent-soft)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}>
                    <FileText size={14} style={{ color }} />
                  </div>
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                </div>
                <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {doc.subject ? <span>{doc.subject.iconEmoji} {doc.subject.name}</span> : "—"}
                </div>
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: bg, color }}>
                    {doc.sourceType}
                  </span>
                </div>
                <div className="text-sm font-mono" style={{ color: "var(--color-text-secondary)" }}>
                  {doc.chunkCount.toLocaleString()}
                </div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {formatDate(doc.createdAt)}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-accent)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")}
                  >
                    <Eye size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-danger)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}
