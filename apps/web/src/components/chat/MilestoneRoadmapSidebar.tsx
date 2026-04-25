"use client";

import { Map, X, CheckCircle2, Circle, BookOpen, Zap } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

export type MasteryTier = "not_started" | "average" | "good" | "excellent";

export interface TopicMastery {
  id: string;
  name: string;
  nameVi: string | null;
  orderIndex: number;
  masteryLevel: number;       // 0.0–1.0
  masteryTier: MasteryTier;
  questionsAsked: number;
  correctAnswers: number;
  lastStudiedAt: string | null;
}

export interface MilestoneData {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  milestoneMastery: number;
  completedTopics: number;
  totalTopics: number;
  topics: TopicMastery[];
}

interface MilestoneRoadmapSidebarProps {
  milestones: MilestoneData[];
  isOpen: boolean;
  onToggle: () => void;
  activeTopicId?: string | null;
  onTopicClick?: (topic: TopicMastery) => void;
  onQuizTopic?: (topicId: string, topicName: string) => void;
  onQuizMilestone?: (milestoneId: string, milestoneName: string) => void;
  subjectName?: string;
  recentlyUpdatedTopicId?: string | null;
}

// ─── Tier config ────────────────────────────────────────────────────────────

const TIER: Record<
  MasteryTier,
  { color: string; bg: string; border: string; label: string; short: string }
> = {
  not_started: {
    color: "var(--color-text-muted)",
    bg: "transparent",
    border: "var(--color-border-subtle)",
    label: "Not started",
    short: "",
  },
  average: {
    color: "var(--color-gold)",
    bg: "rgba(245,166,35,0.12)",
    border: "rgba(245,166,35,0.30)",
    label: "Average",
    short: "Avg",
  },
  good: {
    color: "var(--color-teal)",
    bg: "rgba(0,191,165,0.12)",
    border: "rgba(0,191,165,0.30)",
    label: "Good",
    short: "Good",
  },
  excellent: {
    color: "var(--color-success)",
    bg: "rgba(34,211,163,0.12)",
    border: "rgba(34,211,163,0.30)",
    label: "Excellent",
    short: "Excel",
  },
};

function tierColor(level: number) {
  if (level >= 0.8) return TIER.excellent.color;
  if (level >= 0.5) return TIER.good.color;
  if (level > 0) return TIER.average.color;
  return TIER.not_started.color;
}

// ─── TopicItem ──────────────────────────────────────────────────────────────

function TopicItem({
  topic,
  isActive,
  isUpdated,
  onClick,
  onQuiz,
}: {
  topic: TopicMastery;
  isActive: boolean;
  isUpdated: boolean;
  onClick?: () => void;
  onQuiz?: () => void;
}) {
  const cfg = TIER[topic.masteryTier];
  const pct = Math.round(topic.masteryLevel * 100);
  const isDone = topic.masteryLevel >= 0.5;  // "completed" threshold = Good+

  return (
    <button
      onClick={onClick}
      className="w-full text-left group relative flex items-start gap-2.5 px-3 py-2 transition-all duration-150"
      style={{
        background: isActive
          ? "var(--color-accent-soft)"
          : isUpdated
            ? "var(--color-accent-soft)"
            : "transparent",
        borderLeft: isActive
          ? "2px solid var(--color-accent)"
          : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLElement).style.background = isUpdated
            ? "var(--color-accent-soft)"
            : "transparent";
      }}
    >
      {/* Completion icon */}
      <span className="flex-shrink-0 mt-[1px]">
        {isDone ? (
          <CheckCircle2
            size={15}
            style={{ color: cfg.color }}
            className="transition-all duration-300"
          />
        ) : (
          <Circle
            size={15}
            style={{ color: "var(--color-border-default)" }}
          />
        )}
      </span>

      {/* Topic info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <p
            className="text-[12.5px] leading-snug truncate"
            style={{
              color: isActive
                ? "var(--color-text-primary)"
                : isDone
                  ? "var(--color-text-secondary)"
                  : "var(--color-text-muted)",
              fontWeight: isActive ? 500 : 400,
              textDecoration: "none",
            }}
          >
            {topic.name}
          </p>

          {/* Tier badge — only if studied */}
          {topic.masteryLevel > 0 && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 leading-none"
              style={{
                color: cfg.color,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
              }}
            >
              {pct}%
            </span>
          )}
        </div>

        {/* Progress fill bar — only if studied */}
        {topic.masteryLevel > 0 && (
          <div
            className="mt-1.5 h-[3px] rounded-full overflow-hidden"
            style={{ background: "var(--color-border-subtle)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: cfg.color,
              }}
            />
          </div>
        )}
      </div>

      {/* Pulse dot for recently updated */}
      {isUpdated && (
        <span
          className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
          style={{ background: "var(--color-accent)" }}
        />
      )}

      {/* Quiz trigger — div to avoid nested button inside button */}
      {onQuiz && !isUpdated && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onQuiz(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onQuiz(); } }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity duration-150 cursor-pointer"
          style={{ color: "var(--color-accent)" }}
          title="Quick Quiz (5Q)"
        >
          <Zap size={11} />
        </div>
      )}
    </button>
  );
}

// ─── MilestoneBlock ──────────────────────────────────────────────────────────

function MilestoneBlock({
  milestone,
  activeTopicId,
  recentlyUpdatedTopicId,
  onTopicClick,
  onQuizTopic,
  onQuizMilestone,
  isLast,
}: {
  milestone: MilestoneData;
  activeTopicId?: string | null;
  recentlyUpdatedTopicId?: string | null;
  onTopicClick?: (t: TopicMastery) => void;
  onQuizTopic?: (topicId: string, topicName: string) => void;
  onQuizMilestone?: (milestoneId: string, milestoneName: string) => void;
  isLast: boolean;
}) {
  const pct = Math.round(milestone.milestoneMastery * 100);
  const color = tierColor(milestone.milestoneMastery);
  const allDone = milestone.completedTopics === milestone.totalTopics && milestone.totalTopics > 0;

  return (
    <div className={isLast ? "" : "border-b"} style={{ borderColor: "var(--color-border-subtle)" }}>
      {/* Milestone header */}
      <div
        className="flex items-center justify-between px-3 py-2 sticky top-0 z-10"
        style={{
          background: "var(--color-surface-1)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <BookOpen size={11} style={{ color, flexShrink: 0 }} />
          <span
            className="text-[11px] font-bold uppercase tracking-wider truncate"
            style={{ color }}
          >
            {milestone.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Quiz section button */}
          {onQuizMilestone && (
            <button
              onClick={() => onQuizMilestone(milestone.id, milestone.name)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide transition-all"
              style={{
                color: "var(--color-accent)",
                border: "1px solid var(--color-accent)",
                opacity: 0.7,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
              title="Quiz this section (15Q)"
            >
              <Zap size={8} />
              Quiz
            </button>
          )}
          {/* x/y completed pill */}
          <span
            className="text-[10px] font-semibold"
            style={{ color: "var(--color-text-muted)" }}
          >
            {milestone.completedTopics}/{milestone.totalTopics}
          </span>
          {allDone && (
            <CheckCircle2 size={11} style={{ color: "var(--color-success)" }} />
          )}
        </div>
      </div>

      {/* Milestone bar */}
      {pct > 0 && (
        <div className="px-3 py-1" style={{ background: "var(--color-surface-1)" }}>
          <div
            className="h-[2px] rounded-full overflow-hidden"
            style={{ background: "var(--color-border-subtle)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
        </div>
      )}

      {/* Topics list — all expanded, no collapse */}
      <div>
        {milestone.topics.map((topic) => (
          <TopicItem
            key={topic.id}
            topic={topic}
            isActive={activeTopicId === topic.id}
            isUpdated={recentlyUpdatedTopicId === topic.id}
            onClick={() => onTopicClick?.(topic)}
            onQuiz={onQuizTopic ? () => onQuizTopic(topic.id, topic.name) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Roadmap Content (shared between sidebar & mobile sheet) ────────────────

export function MilestoneRoadmapContent({
  milestones,
  activeTopicId,
  onTopicClick,
  onQuizTopic,
  onQuizMilestone,
  subjectName,
  recentlyUpdatedTopicId,
  onClose,
}: Omit<MilestoneRoadmapSidebarProps, "isOpen" | "onToggle"> & { onClose?: () => void }) {
  const totalTopics = milestones.reduce((s, m) => s + m.totalTopics, 0);
  const doneTopics = milestones.reduce((s, m) => s + m.completedTopics, 0);
  const overallPct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Map size={13} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
          <div className="min-w-0">
            <p
              className="text-[12px] font-semibold truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {subjectName ?? "Progress"}
            </p>
            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              {doneTopics} of {totalTopics} topics completed
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-md transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")
            }
            title="Close"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Overall progress ── */}
      <div
        className="flex-shrink-0 px-3 py-2 border-b"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            Overall progress
          </span>
          <span
            className="text-[11px] font-bold"
            style={{ color: tierColor(overallPct / 100) }}
          >
            {overallPct}%
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--color-surface-2)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${overallPct}%`,
              background: tierColor(overallPct / 100),
            }}
          />
        </div>

        {/* Tier legend chips */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {([
            ["not_started", "○ Not started"],
            ["average", "◐ Average"],
            ["good", "● Good"],
            ["excellent", "✓ Excellent"],
          ] as [MasteryTier, string][]).map(([tier, label]) => (
            <span
              key={tier}
              className="text-[9px] font-medium"
              style={{ color: TIER[tier].color }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Topic checklist (all expanded, scrollable) ── */}
      {milestones.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <p
            className="text-[12px] text-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            No topics found for this subject yet.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {milestones.map((milestone, idx) => (
            <MilestoneBlock
              key={milestone.id}
              milestone={milestone}
              activeTopicId={activeTopicId}
              recentlyUpdatedTopicId={recentlyUpdatedTopicId}
              onTopicClick={onTopicClick}
              onQuizTopic={onQuizTopic}
              onQuizMilestone={onQuizMilestone}
              isLast={idx === milestones.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function MilestoneRoadmapSidebar({
  milestones,
  isOpen,
  onToggle,
  activeTopicId,
  onTopicClick,
  onQuizTopic,
  onQuizMilestone,
  subjectName,
  recentlyUpdatedTopicId,
}: MilestoneRoadmapSidebarProps) {
  return (
    <>
      {/* ── Collapsed strip (desktop only) ── */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="hidden md:flex flex-col items-center justify-center w-9 border-l flex-shrink-0 gap-2 transition-colors"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-subtle)",
            color: "var(--color-text-muted)",
          }}
          title="Show Progress"
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")
          }
        >
          <Map size={15} />
          <span
            className="text-[9px] font-semibold uppercase tracking-wider"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Topics
          </span>
        </button>
      )}

      {/* ── Open sidebar (desktop only) ── */}
      {isOpen && (
        <aside
          className="hidden md:flex flex-col w-64 border-l flex-shrink-0 overflow-hidden"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <MilestoneRoadmapContent
            milestones={milestones}
            activeTopicId={activeTopicId}
            onTopicClick={onTopicClick}
            onQuizTopic={onQuizTopic}
            onQuizMilestone={onQuizMilestone}
            subjectName={subjectName}
            recentlyUpdatedTopicId={recentlyUpdatedTopicId}
            onClose={onToggle}
          />
        </aside>
      )}
    </>
  );
}
