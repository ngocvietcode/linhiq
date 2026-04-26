"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CheckCircle, Clock, ListChecks } from "lucide-react";
import { ParentShell } from "../_components/ParentShell";
import { useParentContext } from "../_lib/parent-context";

interface QuizItem {
  id: string;
  quizType: "TOPIC" | "UNIT";
  score: number;
  total: number;
  accuracy: number;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
  subject: { name: string; iconEmoji: string } | null;
  topicName: string | null;
  unitName: string | null;
}

export default function ParentQuizzesPage() {
  const { token } = useAuth();
  const { activeChild, activeChildId } = useParentContext();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !activeChildId) return;
    setLoading(true);
    api<QuizItem[]>(`/parent/children/${activeChildId}/quizzes?limit=50`, { token })
      .then(setQuizzes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, activeChildId]);

  const stats = useMemo(() => {
    const completed = quizzes.filter((q) => q.completed);
    if (completed.length === 0) return null;
    const avgAccuracy = completed.reduce((s, q) => s + q.accuracy, 0) / completed.length;
    return {
      completed: completed.length,
      total: quizzes.length,
      avgAccuracy,
    };
  }, [quizzes]);

  return (
    <ParentShell
      title={`Lịch sử quiz — ${activeChild?.name ?? ""}`}
      subtitle="Các bài kiểm tra con đã làm gần đây"
    >
      {loading && (
        <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
          Đang tải...
        </p>
      )}

      {!loading && quizzes.length === 0 && (
        <section
          className="rounded-2xl border p-8 text-center"
          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}
        >
          <ListChecks size={32} style={{ color: "var(--color-text-muted)", margin: "0 auto" }} />
          <p className="text-sm mt-3" style={{ color: "var(--color-text-secondary)" }}>
            Con chưa làm bài quiz nào.
          </p>
        </section>
      )}

      {!loading && stats && (
        <section
          className="rounded-2xl border p-5 mb-6 grid grid-cols-3 gap-4"
          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}
        >
          <div>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Đã hoàn thành</p>
            <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{stats.completed}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>trên {stats.total} lượt</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Độ chính xác TB</p>
            <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{Math.round(stats.avgAccuracy * 100)}%</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Đang làm dở</p>
            <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{stats.total - stats.completed}</p>
          </div>
        </section>
      )}

      {!loading && quizzes.length > 0 && (
        <ul className="space-y-2">
          {quizzes.map((q) => {
            const pct = Math.round(q.accuracy * 100);
            const status = pct >= 80 ? "good" : pct >= 50 ? "ok" : "warn";
            const color =
              status === "good" ? "var(--color-success)" : status === "warn" ? "var(--color-warning)" : "var(--color-accent)";
            return (
              <li
                key={q.id}
                className="rounded-xl border p-4 flex items-center gap-4"
                style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: "var(--color-accent-soft)" }}
                >
                  {q.subject?.iconEmoji ?? "📝"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {q.topicName || q.unitName || "(Quiz)"}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: q.quizType === "TOPIC" ? "var(--color-accent-soft)" : "rgba(20,184,166,0.12)",
                        color: q.quizType === "TOPIC" ? "var(--color-accent)" : "var(--color-teal)",
                      }}
                    >
                      {q.quizType === "TOPIC" ? "Chủ đề" : "Chương"}
                    </span>
                  </div>
                  <p className="text-xs flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                    <span>{q.subject?.name ?? "—"}</span>
                    <span>·</span>
                    {q.completed ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={11} /> Hoàn thành {new Date(q.completedAt!).toLocaleDateString("vi-VN")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> Đang làm dở
                      </span>
                    )}
                  </p>
                </div>
                {q.completed && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold" style={{ color }}>
                      {q.score}/{q.total}
                    </p>
                    <p className="text-xs" style={{ color }}>
                      {pct}%
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </ParentShell>
  );
}
