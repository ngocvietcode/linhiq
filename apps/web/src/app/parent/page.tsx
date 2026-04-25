"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  LayoutDashboard, BarChart2, MessageSquare, Settings,
  TrendingUp, AlertCircle, Clock, CheckCircle,
  Flame
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/parent", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/parent/reports", icon: BarChart2, label: "Báo cáo" },
  { href: "/parent/messages", icon: MessageSquare, label: "Tin nhắn" },
  { href: "/parent/settings", icon: Settings, label: "Cài đặt" },
];

interface Child {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  curriculum: string | null;
  streakDays: number;
  lastStudyAt: string | null;
}

interface SubjectProgress {
  id: string;
  name: string;
  iconEmoji: string;
  totalTopics: number;
  masteredTopics: number;
  overallMastery: number;
}

interface ChildOverview {
  child: { id: string; name: string; curriculum: string | null };
  overview: { streakDays: number; studyTimeMin: number; subjects: SubjectProgress[] };
  summary: { questionsThisWeek: number; totalAsked: number; totalCorrect: number; accuracy: number };
  chatStats: {
    totals: { academic: number; general: number; hobbies: number; life: number; redirected: number; totalMsg: number };
    ratios: { academic: number; general: number; hobbies: number; life: number; redirected: number };
  };
  studyBySubject: { subjectId: string; name: string; iconEmoji: string; minutes: number }[];
}

function formatMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.FC<{ size: number; style?: React.CSSProperties }>;
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl border p-4"
      style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
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
  const pathname = usePathname();
  const { token, user } = useAuth();
  const [children, setChildren] = useState<Child[] | null>(null);
  const [activeChildId, setActiveChildId] = useState<string>("");
  const [data, setData] = useState<ChildOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<Child[]>("/parent/children", { token })
      .then((list) => {
        setChildren(list);
        if (list.length > 0) setActiveChildId(list[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !activeChildId) return;
    setLoading(true);
    api<ChildOverview>(`/parent/children/${activeChildId}/overview`, { token })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, activeChildId]);

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
    <div className="min-h-screen flex" style={{ background: "var(--color-surface-1)" }}>
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 border-r"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
        <div className="px-5 py-6 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <span className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ{" "}
            <span className="text-sm font-normal" style={{ color: "var(--color-text-muted)" }}>Parent</span>
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? "var(--color-accent-soft)" : "transparent",
                  color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                }}>
                <Icon size={18} />{label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{user?.name ?? "Phụ huynh"}</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Tài khoản phụ huynh</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 md:ml-0">
        <header className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between"
          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
              Xin chào, {user?.name ?? "Phụ huynh"}.
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {child ? `Đây là tình hình học tập của ${child.name} tuần này.` : "Chưa có học sinh nào được liên kết."}
            </p>
          </div>
          {children && children.length > 1 && (
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

        <main className="px-5 md:px-8 py-8 max-w-4xl mx-auto">
          {!loading && children && children.length === 0 && (
            <section className="rounded-2xl border p-8 text-center"
              style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}>
              <p className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                Chưa có học sinh liên kết
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Hãy liên hệ quản trị viên để được liên kết với tài khoản học sinh.
              </p>
            </section>
          )}

          {data && (
            <>
              {/* Student summary card */}
              <section className="rounded-2xl border p-6 mb-8"
                style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-md)" }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{data.child.name}</h2>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {data.child.curriculum ?? "—"}
                    </p>
                  </div>
                  <Link href="/parent/reports"
                    className="text-sm font-medium flex items-center gap-1"
                    style={{ color: "var(--color-accent)" }}>
                    Xem báo cáo chi tiết <TrendingUp size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard
                    icon={Clock as React.FC<{ size: number; style?: React.CSSProperties }>}
                    label="Thời gian học"
                    value={formatMin(data.overview.studyTimeMin)}
                    sub="tổng cộng"
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
              </section>

              {/* Chat category breakdown */}
              {data.chatStats.totals.totalMsg > 0 && (
                <section className="mb-8">
                  <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
                    TỶ LỆ NỘI DUNG CHAT
                  </h2>
                  <div className="rounded-2xl border p-5"
                    style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
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
                    <p className="text-xs mt-4" style={{ color: "var(--color-text-muted)" }}>
                      Dựa trên {data.chatStats.totals.totalMsg} tin nhắn. Hệ thống tự động phân loại theo ngữ cảnh học tập, đời sống, sở thích, và các nội dung cần định hướng lại.
                    </p>
                  </div>
                </section>
              )}

              {/* Subject overview */}
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
                        <div key={s.id} className="rounded-xl border p-5"
                          style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">{s.iconEmoji}</span>
                            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.name}</span>
                          </div>
                          <div className="progress-bar mb-2">
                            <div className="progress-fill" style={{
                              width: `${pct}%`,
                              background: status === "good"
                                ? "var(--color-success)"
                                : status === "warn"
                                ? "var(--color-warning)"
                                : "var(--color-accent)",
                            }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                              {s.masteredTopics}/{s.totalTopics} chủ đề đã nắm vững
                            </span>
                            <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Attention needed */}
              {weakSubject && weakSubject.overallMastery < 0.5 && (
                <section className="mb-8">
                  <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-muted)" }}>
                    CẦN CHÚ Ý
                  </h2>
                  <div className="rounded-xl border p-4 flex items-start gap-3"
                    style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.2)" }}>
                    <AlertCircle size={16} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {data.child.name} đang gặp khó khăn với môn {weakSubject.name}.
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        Mức độ nắm vững chỉ {Math.round(weakSubject.overallMastery * 100)}%. Có thể cần hỗ trợ thêm.
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
