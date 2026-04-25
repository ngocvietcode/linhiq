"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

interface Child {
  id: string;
  name: string;
}

interface Report {
  studyHours: { date: string; minutes: number }[];
  studyBySubject: { subjectId: string; name: string; iconEmoji: string; minutes: number }[];
  chatStats: {
    totals: { academic: number; general: number; hobbies: number; life: number; redirected: number; totalMsg: number };
    ratios: { academic: number; general: number; hobbies: number; life: number; redirected: number };
  };
  summary: { questionsThisWeek: number; totalAsked: number; totalCorrect: number; accuracy: number };
  topTopics: {
    topicName: string;
    subjectName: string;
    subjectIcon: string;
    questionsAsked: number;
    masteryLevel: number;
    lastStudiedAt: string | null;
  }[];
  strengths: string[];
  weaknesses: { topic: string; masteryLevel: number; questionsAsked: number }[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CATEGORY_META = [
  { k: "academic" as const, label: "Học tập", color: "var(--color-accent)" },
  { k: "general"  as const, label: "Tổng quát", color: "var(--color-teal)" },
  { k: "hobbies"  as const, label: "Sở thích", color: "var(--color-gold)" },
  { k: "life"     as const, label: "Đời sống", color: "#8B5CF6" },
  { k: "redirected" as const, label: "Chuyển hướng", color: "var(--color-warning)" },
];

function formatMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export default function ParentReportPage() {
  const { token } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [activeChildId, setActiveChildId] = useState<string>("");
  const [report, setReport] = useState<Report | null>(null);
  const [childName, setChildName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<Child[]>("/parent/children", { token })
      .then((list) => {
        setChildren(list);
        if (list.length > 0) {
          setActiveChildId(list[0].id);
          setChildName(list[0].name);
        } else {
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (!token || !activeChildId) return;
    setLoading(true);
    const match = children.find((c) => c.id === activeChildId);
    if (match) setChildName(match.name);
    api<Report>(`/parent/children/${activeChildId}/report`, { token })
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, activeChildId, children]);

  const maxH = report ? Math.max(...report.studyHours.map((d) => d.minutes), 60) : 60;
  const totalMin = report ? report.studyHours.reduce((s, d) => s + d.minutes, 0) : 0;
  const subjectTotal = report ? report.studyBySubject.reduce((s, d) => s + d.minutes, 0) : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-1)" }}>
      <header className="sticky top-0 z-10 px-6 py-4 border-b flex items-center gap-4"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
        <Link href="/parent" className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--color-text-secondary)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
            Báo cáo tuần của {childName || "học sinh"}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            7 ngày gần nhất
          </p>
        </div>
        {children.length > 1 && (
          <select
            value={activeChildId}
            onChange={(e) => setActiveChildId(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-full border"
            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </header>

      <main className="px-5 md:px-8 py-8 max-w-3xl mx-auto space-y-8">
        {loading && (
          <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>Đang tải...</p>
        )}

        {!loading && children.length === 0 && (
          <section className="rounded-2xl border p-8 text-center"
            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Chưa có học sinh nào được liên kết với tài khoản này.
            </p>
          </section>
        )}

        {!loading && report && (
          <>
            {/* Study hours chart */}
            <section className="rounded-2xl border p-6"
              style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
              <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--color-text-muted)" }}>
                THỜI GIAN HỌC
              </h2>
              <div className="flex items-end gap-3 h-24 mb-3">
                {report.studyHours.map(({ date, minutes }) => {
                  const d = new Date(date + "T00:00:00");
                  const label = DAY_LABELS[d.getDay()];
                  const hoursLabel = minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : minutes > 0 ? `${minutes}m` : "";
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-xs font-mono font-medium" style={{ color: "var(--color-text-secondary)" }}>
                        {hoursLabel}
                      </span>
                      <div
                        className="w-full rounded-md"
                        style={{
                          height: `${Math.max((minutes / maxH) * 100, 4)}%`,
                          background: minutes > 0
                            ? "linear-gradient(to top, var(--color-accent-border), var(--color-accent-border))"
                            : "var(--color-border-subtle)",
                          transition: "height 0.6s cubic-bezier(0.16,1,0.3,1)",
                        }}
                      />
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t pt-4"
                style={{ borderColor: "var(--color-border-subtle)" }}>
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Tổng tuần này</span>
                <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {formatMin(totalMin)}
                </span>
              </div>
            </section>

            {/* Subject breakdown */}
            {report.studyBySubject.length > 0 && (
              <section className="rounded-2xl border p-6"
                style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--color-text-muted)" }}>
                  PHÂN BỔ THEO MÔN
                </h2>
                <div className="space-y-4">
                  {report.studyBySubject.map((s) => {
                    const pct = subjectTotal > 0 ? Math.round((s.minutes / subjectTotal) * 100) : 0;
                    return (
                      <div key={s.subjectId}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span>{s.iconEmoji}</span>
                            <span className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>{s.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{formatMin(s.minutes)}</span>
                            <span className="text-sm font-bold w-8 text-right" style={{ color: "var(--color-text-primary)" }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Chat category distribution */}
            {report.chatStats.totals.totalMsg > 0 && (
              <section className="rounded-2xl border p-6"
                style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--color-text-muted)" }}>
                  TỶ LỆ NỘI DUNG CHAT
                </h2>
                <div className="flex h-3 rounded-full overflow-hidden mb-4" style={{ background: "var(--color-border-subtle)" }}>
                  {CATEGORY_META.map((c) => {
                    const pct = report.chatStats.ratios[c.k] * 100;
                    if (pct <= 0) return null;
                    return <div key={c.k} style={{ width: `${pct}%`, background: c.color }} title={`${c.label} · ${pct.toFixed(0)}%`} />;
                  })}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {CATEGORY_META.map((c) => {
                    const pct = Math.round(report.chatStats.ratios[c.k] * 100);
                    const n = report.chatStats.totals[c.k];
                    return (
                      <div key={c.k} className="flex items-start gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm mt-1 flex-shrink-0" style={{ background: c.color }} />
                        <div>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.label}</p>
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                            {pct}% <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>({n})</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs mt-4" style={{ color: "var(--color-text-muted)" }}>
                  {report.summary.questionsThisWeek} câu hỏi tuần này. Độ chính xác: {Math.round(report.summary.accuracy * 100)}%.
                </p>
              </section>
            )}

            {/* Top topics */}
            {report.topTopics.length > 0 && (
              <section className="rounded-2xl border p-6"
                style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--color-text-muted)" }}>
                  CHỦ ĐỀ ĐÃ HỌC
                </h2>
                <ul className="space-y-2 pl-1">
                  {report.topTopics.map((t) => (
                    <li key={t.topicName} className="flex items-start gap-2">
                      <span>{t.subjectIcon}</span>
                      <div className="flex-1">
                        <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{t.topicName}</span>
                        <span className="text-xs ml-2" style={{ color: "var(--color-text-muted)" }}>
                          ({t.subjectName} · {t.questionsAsked} câu hỏi · {Math.round(t.masteryLevel * 100)}%)
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Strengths & weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <section className="rounded-2xl border p-5"
                style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
                  ĐIỂM MẠNH
                </h2>
                {report.strengths.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Chưa có chủ đề nào đạt mức thành thạo.</p>
                ) : (
                  <ul className="space-y-3">
                    {report.strengths.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-primary)" }}>
                        <CheckCircle size={14} style={{ color: "var(--color-success)", flexShrink: 0 }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border p-5"
                style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
                  CẦN CẢI THIỆN
                </h2>
                {report.weaknesses.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Không có chủ đề yếu nổi bật.</p>
                ) : (
                  <ul className="space-y-3">
                    {report.weaknesses.map((w) => (
                      <li key={w.topic} className="flex items-start gap-2 text-sm">
                        <AlertTriangle size={14} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <span style={{ color: "var(--color-text-primary)" }}>{w.topic}</span>
                          <span className="text-xs ml-1" style={{ color: "var(--color-text-muted)" }}>
                            (chỉ {Math.round(w.masteryLevel * 100)}% đúng · {w.questionsAsked} câu)
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
