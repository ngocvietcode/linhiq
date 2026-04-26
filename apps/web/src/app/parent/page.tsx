"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  BarChart2,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  Flame,
  ChevronRight,
  ShieldAlert,
  Pencil,
  UserPlus,
} from "lucide-react";
import { ParentShell } from "./_components/ParentShell";
import { useParentContext } from "./_lib/parent-context";

interface SubjectProgress {
  id: string;
  name: string;
  iconEmoji: string;
  totalTopics: number;
  masteredTopics: number;
  overallMastery: number;
}

interface ChildOverview {
  child: {
    id: string;
    name: string;
    curriculum: string | null;
    studyGoal: number;
    lastStudyAt: string | null;
  };
  overview: { streakDays: number; studyTimeMin: number; subjects: SubjectProgress[] };
  summary: { questionsThisWeek: number; totalAsked: number; totalCorrect: number; accuracy: number };
  chatStats: {
    totals: { academic: number; general: number; hobbies: number; life: number; redirected: number; totalMsg: number };
    ratios: { academic: number; general: number; hobbies: number; life: number; redirected: number };
  };
  studyHours: { date: string; minutes: number }[];
  studyBySubject: { subjectId: string; name: string; iconEmoji: string; minutes: number }[];
  days: number;
}

interface AlertItem {
  id: string;
  sessionId: string;
  content: string;
  createdAt: string;
  category: string | null;
  wasRedirected: boolean;
}

function formatMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.FC<{ size: number; style?: React.CSSProperties }>;
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color }} />
        <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{sub}</p>}
    </div>
  );
}

export default function ParentHomePage() {
  const { token } = useAuth();
  const { user } = useAuth();
  const { children: list, activeChild, activeChildId, loading: childrenLoading, refresh } = useParentContext();
  const [data, setData] = useState<ChildOverview | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState<number>(60);

  useEffect(() => {
    if (!token || !activeChildId) return;
    setLoading(true);
    Promise.all([
      api<ChildOverview>(`/parent/children/${activeChildId}/overview?days=7`, { token }),
      api<AlertItem[]>(`/parent/children/${activeChildId}/alerts?days=14`, { token }).catch(() => []),
    ])
      .then(([o, a]) => {
        setData(o);
        setAlerts(a);
        setGoalDraft(o.child.studyGoal);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, activeChildId]);

  async function saveGoal() {
    if (!token || !activeChildId) return;
    try {
      await api(`/parent/children/${activeChildId}/study-goal`, {
        token,
        method: "PATCH",
        body: { goalMin: goalDraft },
      });
      setEditingGoal(false);
      await refresh();
      const o = await api<ChildOverview>(`/parent/children/${activeChildId}/overview?days=7`, { token });
      setData(o);
    } catch (e) {
      console.error(e);
    }
  }

  const child = data?.child;
  const weakSubject = data?.overview.subjects.reduce<SubjectProgress | null>(
    (weakest, s) => {
      if (s.totalTopics === 0) return weakest;
      if (!weakest) return s;
      return s.overallMastery < weakest.overallMastery ? s : weakest;
    },
    null,
  );

  return (
    <ParentShell
      title={`Xin chào, ${user?.name ?? "Phụ huynh"}.`}
      subtitle={
        child
          ? `Đây là tình hình học tập của ${child.name} tuần này.`
          : "Chưa có học sinh nào được liên kết."
      }
    >
      {!childrenLoading && list.length === 0 && (
        <section
          className="rounded-2xl border p-8 text-center"
          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}
        >
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            Chưa có học sinh liên kết
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
            Hãy tạo tài khoản mới cho con hoặc gửi mã liên kết cho tài khoản con đã có.
          </p>
          <Link
            href="/parent/link-child"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
            style={{ background: "var(--color-accent)", color: "#fff", textDecoration: "none" }}
          >
            <UserPlus size={14} /> Tạo / liên kết tài khoản con
          </Link>
        </section>
      )}

      {activeChild?.inactive && (
        <section
          className="rounded-xl border p-4 mb-6 flex items-start gap-3"
          style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.25)" }}
        >
          <AlertCircle size={18} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {activeChild.name} đã không học {activeChild.daysSinceLastStudy} ngày.
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              Nên nhắc con quay lại lịch học để giữ chuỗi ngày học liên tục.
            </p>
          </div>
        </section>
      )}

      {alerts.length > 0 && (
        <section
          className="rounded-xl border p-4 mb-6 flex items-start gap-3"
          style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.25)" }}
        >
          <ShieldAlert size={18} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Có {alerts.length} nội dung chat cần chú ý trong 14 ngày qua.
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              Bao gồm các tin nhắn được hệ thống định hướng lại hoặc thuộc nhóm cảm xúc/nhạy cảm.
            </p>
          </div>
          <Link
            href="/parent/alerts"
            className="text-xs font-medium flex items-center gap-1 flex-shrink-0"
            style={{ color: "var(--color-warning)" }}
          >
            Xem chi tiết <ChevronRight size={12} />
          </Link>
        </section>
      )}

      {data && (
        <>
          <section
            className="rounded-2xl border p-6 mb-8"
            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {data.child.name}
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {data.child.curriculum ?? "—"}
                </p>
              </div>
              <Link
                href="/parent/reports"
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: "var(--color-accent)" }}
              >
                Xem báo cáo chi tiết <TrendingUp size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={Clock as React.FC<{ size: number; style?: React.CSSProperties }>}
                label="Thời gian học"
                value={formatMin(data.studyHours.reduce((s, p) => s + p.minutes, 0))}
                sub="7 ngày qua"
                color="var(--color-accent)"
              />
              <StatCard
                icon={MessageSquare as React.FC<{ size: number; style?: React.CSSProperties }>}
                label="Câu hỏi"
                value={`${data.summary.questionsThisWeek}`}
                sub="tuần này"
                color="#3B82F6"
              />
              <StatCard
                icon={CheckCircle as React.FC<{ size: number; style?: React.CSSProperties }>}
                label="Độ chính xác"
                value={`${Math.round(data.summary.accuracy * 100)}%`}
                sub={`${data.summary.totalCorrect}/${data.summary.totalAsked} câu đúng`}
                color="#10B981"
              />
              <StatCard
                icon={Flame as React.FC<{ size: number; style?: React.CSSProperties }>}
                label="Chuỗi ngày"
                value={`${data.overview.streakDays}`}
                sub="ngày học liên tục"
                color="var(--color-gold)"
              />
            </div>

            <div className="mt-6 pt-5 border-t flex items-center justify-between"
              style={{ borderColor: "var(--color-border-subtle)" }}>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                  Mục tiêu học mỗi ngày
                </p>
                {editingGoal ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={goalDraft}
                      onChange={(e) => setGoalDraft(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm rounded border"
                      style={{
                        background: "var(--color-surface-1)",
                        borderColor: "var(--color-border-default)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>phút/ngày</span>
                  </div>
                ) : (
                  <p className="text-base font-semibold mt-1" style={{ color: "var(--color-text-primary)" }}>
                    {data.child.studyGoal} phút/ngày
                  </p>
                )}
              </div>
              {editingGoal ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingGoal(false); setGoalDraft(data.child.studyGoal); }}
                    className="text-xs px-3 py-1.5 rounded-full border"
                    style={{
                      borderColor: "var(--color-border-default)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={saveGoal}
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "var(--color-accent)", color: "#fff" }}
                  >
                    Lưu
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingGoal(true)}
                  className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: "var(--color-border-default)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <Pencil size={12} /> Chỉnh sửa
                </button>
              )}
            </div>
          </section>

          {data.chatStats.totals.totalMsg > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
                TỶ LỆ NỘI DUNG CHAT
              </h2>
              <div
                className="rounded-2xl border p-5"
                style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex h-3 rounded-full overflow-hidden mb-4" style={{ background: "var(--color-border-subtle)" }}>
                  {[
                    { k: "academic", color: "var(--color-accent)", label: "Học tập" },
                    { k: "general",  color: "var(--color-teal)",   label: "Tổng quát" },
                    { k: "hobbies",  color: "var(--color-gold)",   label: "Sở thích" },
                    { k: "life",     color: "#8B5CF6",             label: "Đời sống" },
                    { k: "redirected", color: "var(--color-warning)", label: "Chuyển hướng" },
                  ].map((c) => {
                    const pct = data.chatStats.ratios[c.k as keyof typeof data.chatStats.ratios] * 100;
                    if (pct <= 0) return null;
                    return <div key={c.k} style={{ width: `${pct}%`, background: c.color }} title={`${c.label} · ${pct.toFixed(0)}%`} />;
                  })}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { k: "academic", color: "var(--color-accent)", label: "Học tập" },
                    { k: "general",  color: "var(--color-teal)",   label: "Tổng quát" },
                    { k: "hobbies",  color: "var(--color-gold)",   label: "Sở thích" },
                    { k: "life",     color: "#8B5CF6",             label: "Đời sống" },
                    { k: "redirected", color: "var(--color-warning)", label: "Chuyển hướng" },
                  ].map((c) => {
                    const r = data.chatStats.ratios[c.k as keyof typeof data.chatStats.ratios];
                    const n = data.chatStats.totals[c.k as keyof typeof data.chatStats.totals] as number;
                    return (
                      <div key={c.k} className="flex items-start gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm mt-1 flex-shrink-0" style={{ background: c.color }} />
                        <div>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.label}</p>
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                            {Math.round(r * 100)}% <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>({n})</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {data.overview.subjects.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
                TỔNG QUAN MÔN HỌC
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.overview.subjects.map((s) => {
                  const pct = Math.round(s.overallMastery * 100);
                  const status = pct >= 70 ? "good" : pct >= 40 ? "ok" : "warn";
                  return (
                    <Link
                      key={s.id}
                      href={`/parent/subjects/${s.id}`}
                      className="rounded-xl border p-5 transition-all"
                      style={{
                        background: "var(--color-surface-2)",
                        borderColor: "var(--color-border-subtle)",
                        boxShadow: "var(--shadow-sm)",
                        textDecoration: "none",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">{s.iconEmoji}</span>
                        <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.name}</span>
                      </div>
                      <div className="progress-bar mb-2">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${pct}%`,
                            background:
                              status === "good"
                                ? "var(--color-success)"
                                : status === "warn"
                                ? "var(--color-warning)"
                                : "var(--color-accent)",
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          {s.masteredTopics}/{s.totalTopics} chủ đề
                        </span>
                        <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{pct}%</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {weakSubject && weakSubject.overallMastery < 0.5 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
                CẦN CHÚ Ý
              </h2>
              <Link
                href={`/parent/subjects/${weakSubject.id}`}
                className="rounded-xl border p-4 flex items-start gap-3"
                style={{
                  background: "rgba(245,158,11,0.04)",
                  borderColor: "rgba(245,158,11,0.2)",
                  textDecoration: "none",
                }}
              >
                <AlertCircle size={16} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {data.child.name} đang gặp khó khăn với môn {weakSubject.name}.
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                    Mức độ nắm vững chỉ {Math.round(weakSubject.overallMastery * 100)}%. Có thể cần hỗ trợ thêm.
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--color-warning)" }} />
              </Link>
            </section>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/parent/chats"
              className="rounded-xl border p-4 flex items-center gap-3"
              style={{
                background: "var(--color-surface-2)",
                borderColor: "var(--color-border-subtle)",
                textDecoration: "none",
              }}
            >
              <MessageSquare size={18} style={{ color: "var(--color-accent)" }} />
              <span className="text-sm font-medium flex-1" style={{ color: "var(--color-text-primary)" }}>
                Xem lịch sử chat
              </span>
              <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
            </Link>
            <Link
              href="/parent/quizzes"
              className="rounded-xl border p-4 flex items-center gap-3"
              style={{
                background: "var(--color-surface-2)",
                borderColor: "var(--color-border-subtle)",
                textDecoration: "none",
              }}
            >
              <CheckCircle size={18} style={{ color: "var(--color-success)" }} />
              <span className="text-sm font-medium flex-1" style={{ color: "var(--color-text-primary)" }}>
                Lịch sử quiz
              </span>
              <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
            </Link>
            <Link
              href="/parent/timeline"
              className="rounded-xl border p-4 flex items-center gap-3"
              style={{
                background: "var(--color-surface-2)",
                borderColor: "var(--color-border-subtle)",
                textDecoration: "none",
              }}
            >
              <BarChart2 size={18} style={{ color: "var(--color-teal)" }} />
              <span className="text-sm font-medium flex-1" style={{ color: "var(--color-text-primary)" }}>
                Hoạt động gần đây
              </span>
              <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
            </Link>
          </section>
        </>
      )}

      {loading && !data && (
        <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
          Đang tải...
        </p>
      )}
    </ParentShell>
  );
}
