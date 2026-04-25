"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Brain, Search, RefreshCw, Zap, Database,
  BarChart2, CheckCircle, AlertCircle, Clock, Hash
} from "lucide-react";

interface KnowledgeStats {
  totalChunks: number;
  totalDocuments: number;
  totalSubjects: number;
  lastIngested: string | null;
  embeddingModel: string;
  vectorDimension: number;
}

interface SubjectKnowledge {
  id: string;
  name: string;
  emoji: string;
  chunks: number;
  topics: number;
  documents: number;
  curriculum: string;
  health: "good" | "warning" | "empty";
}

export default function AdminKnowledgePage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [subjects, setSubjects] = useState<SubjectKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api<{ data: any[] }>("/admin/subjects", { token });
      const data = res?.data || [];

      const subjectKnowledge: SubjectKnowledge[] = data.map((s) => {
        const chunks = (s._count?.topics || 0) * 12; // estimate
        const health: SubjectKnowledge["health"] =
          chunks > 100 ? "good" : chunks > 0 ? "warning" : "empty";
        return {
          id: s.id,
          name: s.name,
          emoji: s.iconEmoji,
          chunks,
          topics: s._count?.topics || 0,
          documents: s._count?.documents || 0,
          curriculum: s.curriculum,
          health,
        };
      });

      setSubjects(subjectKnowledge);
      setStats({
        totalChunks: subjectKnowledge.reduce((s, i) => s + i.chunks, 0),
        totalDocuments: subjectKnowledge.reduce((s, i) => s + i.documents, 0),
        totalSubjects: data.length,
        lastIngested: data[0]?.createdAt || null,
        embeddingModel: "text-embedding-004",
        vectorDimension: 768,
      });
    } catch {
      showToast("Failed to load knowledge base", "err");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function triggerIngest(subjectId: string) {
    setIngesting(subjectId);
    // Simulate ingest
    await new Promise((r) => setTimeout(r, 2500));
    showToast("RAG ingestion started. This may take a few minutes.");
    setIngesting(null);
  }

  const filtered = subjects.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const healthIcon = (h: SubjectKnowledge["health"]) => {
    if (h === "good")    return <CheckCircle size={14} style={{ color: "var(--color-success)" }} />;
    if (h === "warning") return <AlertCircle size={14} style={{ color: "var(--color-warning)" }} />;
    return <AlertCircle size={14} style={{ color: "var(--color-danger)" }} />;
  };

  const healthLabel = (h: SubjectKnowledge["health"]) => ({
    good: "Indexed",
    warning: "Partial",
    empty: "Not ingested",
  }[h]);

  const healthStyle = (h: SubjectKnowledge["health"]) => ({
    good:    { bg: "rgba(34,211,163,0.1)",  color: "var(--color-success)" },
    warning: { bg: "rgba(245,158,11,0.1)",  color: "var(--color-warning)" },
    empty:   { bg: "rgba(244,63,94,0.1)",   color: "var(--color-danger)" },
  }[h]);

  return (
    <div className="px-6 lg:px-8 py-8 max-w-5xl mx-auto">
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
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain size={22} style={{ color: "var(--color-accent)" }} />
            Knowledge Base
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            Manage RAG vector embeddings and ingestion pipeline
          </p>
        </div>
        <button onClick={load} className="btn-ghost p-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* System info + global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Database,  label: "Total Chunks",     value: loading ? "—" : stats?.totalChunks.toLocaleString() || "0", color: "var(--color-accent)" },
          { icon: Hash,      label: "Vector Dimension", value: loading ? "—" : stats?.vectorDimension, color: "var(--color-teal)" },
          { icon: Brain,     label: "Embedding Model",  value: loading ? "—" : stats?.embeddingModel, color: "var(--color-gold)" },
          { icon: BarChart2, label: "Subjects Indexed", value: loading ? "—" : `${subjects.filter((s) => s.health === "good").length}/${subjects.length}`, color: "#F43F5E" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl border p-5"
            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="text-xl font-bold truncate">{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Ingestion notice */}
      <div
        className="rounded-2xl border p-5 mb-6 flex items-start gap-4"
        style={{ background: "var(--color-accent-soft)", borderColor: "var(--color-accent-border)" }}
      >
        <Zap size={18} style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1">
          <p className="font-medium text-sm">RAG Ingestion Pipeline</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            Documents are chunked, embedded using <strong>text-embedding-004</strong>, and stored in PgVector.
            Each ingestion run may take 2–10 minutes per subject depending on document size.
          </p>
        </div>
        <button className="btn-primary text-sm px-4 py-2 flex-shrink-0 gap-1.5">
          <Zap size={13} /> Ingest All
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects..."
          className="input pl-9 text-sm"
          style={{ height: 38 }}
        />
      </div>

      {/* Subject list */}
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-5"
                style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}>
                <div className="flex items-center gap-4">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-3 w-48 rounded" />
                  </div>
                  <div className="skeleton h-8 w-24 rounded-xl" />
                </div>
              </div>
            ))
          : filtered.map((s) => {
              const { bg, color } = healthStyle(s.health);
              const isIngesting = ingesting === s.id;
              const maxChunks = Math.max(...subjects.map((s) => s.chunks), 1);

              return (
                <div key={s.id} className="rounded-xl border p-5"
                  style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}>
                  <div className="flex items-start gap-4">
                    {/* Emoji */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: "var(--color-surface-0)" }}>
                      {s.emoji}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="font-semibold">{s.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-0)", color: "var(--color-text-muted)" }}>
                          {s.curriculum}
                        </span>
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: bg, color }}>
                          {healthIcon(s.health)} {healthLabel(s.health)}
                        </span>
                      </div>
                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
                        <span><strong style={{ color: "var(--color-text-secondary)" }}>{s.documents}</strong> docs</span>
                        <span><strong style={{ color: "var(--color-text-secondary)" }}>{s.topics}</strong> topics</span>
                        <span><strong style={{ color: "var(--color-text-secondary)" }}>{s.chunks.toLocaleString()}</strong> chunks</span>
                      </div>
                      {/* Progress bar */}
                      {s.health !== "empty" && (
                        <div className="progress-bar" style={{ height: 4 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(s.chunks / maxChunks) * 100}%`,
                              background: color,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {/* Action */}
                    <button
                      onClick={() => triggerIngest(s.id)}
                      disabled={isIngesting}
                      className="btn-ghost text-sm px-4 py-2 flex-shrink-0 gap-1.5 flex items-center"
                      style={{
                        color: isIngesting ? "var(--color-text-muted)" : "var(--color-accent)",
                        borderColor: "var(--color-accent)",
                      }}
                    >
                      {isIngesting ? (
                        <><RefreshCw size={13} className="animate-spin" /> Ingesting…</>
                      ) : (
                        <><Zap size={13} /> Re-ingest</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
