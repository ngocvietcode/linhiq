"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ArrowLeft, Clock, CheckCircle } from "lucide-react";
import { ParentShell } from "../../_components/ParentShell";
import { useParentContext } from "../../_lib/parent-context";

interface TopicNode {
  id: string;
  name: string;
  masteryLevel: number;
  questionsAsked: number;
  correctAnswers: number;
  lastStudiedAt: string | null;
}

interface UnitNode {
  id: string;
  name: string;
  topics: TopicNode[];
  totalTopics: number;
  masteredTopics: number;
  avgMastery: number;
}

interface SubjectDetail {
  subject: { id: string; name: string; iconEmoji: string; curriculum: string };
  studyMinutes: number;
  units: UnitNode[];
  recentQuizzes: {
    id: string;
    score: number;
    total: number;
    accuracy: number;
    topicName: string | null;
    unitName: string | null;
    createdAt: string;
    completedAt: string | null;
  }[];
}

function formatMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export default function ParentSubjectDetailPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const { token } = useAuth();
  const { activeChild, activeChildId } = useParentContext();
  const [data, setData] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !activeChildId || !subjectId) return;
    setLoading(true);
    api<SubjectDetail>(`/parent/children/${activeChildId}/subjects/${subjectId}`, { token })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, activeChildId, subjectId]);

  return (
    <ParentShell
      title={
        data ? (
          <span>
            <span className="mr-2">{data.subject.iconEmoji}</span>
            {data.subject.name}
          </span>
        ) : (
          "Môn học"
        )
      }
      subtitle={activeChild ? `Chi tiết tiến độ của ${activeChild.name}` : undefined}
      rightSlot={
        <Link
          href="/parent"
          className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
          style={{
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-secondary)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> Quay lại
        </Link>
      }
    >
      {loading && (
        <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
          Đang tải...
        </p>
      )}

      {!loading && data && (
        <>
          <section
            className="rounded-2xl border p-5 mb-6 grid grid-cols-3 gap-4"
            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}
          >
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                Thời gian học
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                {formatMin(data.studyMinutes)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                Chương
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                {data.units.length}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                Chủ đề thành thạo
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                {data.units.reduce((s, u) => s + u.masteredTopics, 0)}/
                {data.units.reduce((s, u) => s + u.totalTopics, 0)}
              </p>
            </div>
          </section>

          {data.units.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
              Môn học chưa có chương nào.
            </p>
          )}

          <section className="space-y-6">
            {data.units.map((u) => {
              const pct = Math.round(u.avgMastery * 100);
              return (
                <div
                  key={u.id}
                  className="rounded-2xl border p-5"
                  style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {u.name}
                    </h3>
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {u.masteredTopics}/{u.totalTopics} thành thạo · {pct}%
                    </span>
                  </div>
                  <div className="progress-bar mb-4">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct >= 70 ? "var(--color-success)" : pct >= 40 ? "var(--color-accent)" : "var(--color-warning)",
                      }}
                    />
                  </div>
                  <ul className="space-y-2">
                    {u.topics.map((t) => {
                      const tp = Math.round(t.masteryLevel * 100);
                      const tcolor =
                        tp >= 80 ? "var(--color-success)" : tp >= 50 ? "var(--color-accent)" : "var(--color-warning)";
                      return (
                        <li key={t.id} className="flex items-center gap-3 py-1.5">
                          <span className="flex-1 text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
                            {t.name}
                          </span>
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {t.questionsAsked > 0 ? `${t.correctAnswers}/${t.questionsAsked}` : "—"}
                          </span>
                          <span className="text-sm font-bold w-12 text-right" style={{ color: tcolor }}>
                            {t.questionsAsked > 0 ? `${tp}%` : "—"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </section>

          {data.recentQuizzes.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
                QUIZ GẦN ĐÂY
              </h2>
              <ul className="space-y-2">
                {data.recentQuizzes.map((q) => {
                  const pct = Math.round(q.accuracy * 100);
                  const color =
                    pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-accent)" : "var(--color-warning)";
                  return (
                    <li
                      key={q.id}
                      className="rounded-xl border p-3 flex items-center gap-3"
                      style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                          {q.topicName || q.unitName || "(Quiz)"}
                        </p>
                        <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
                          {q.completedAt ? (
                            <>
                              <CheckCircle size={11} /> {new Date(q.completedAt).toLocaleDateString("vi-VN")}
                            </>
                          ) : (
                            <>
                              <Clock size={11} /> Đang làm dở
                            </>
                          )}
                        </p>
                      </div>
                      {q.completedAt && (
                        <span className="text-sm font-bold" style={{ color }}>
                          {q.score}/{q.total} ({pct}%)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </ParentShell>
  );
}
