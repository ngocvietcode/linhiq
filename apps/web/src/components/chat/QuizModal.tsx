"use client";

import { useState, useCallback, useEffect } from "react";
import {
  X, ChevronRight, CheckCircle2, XCircle,
  Loader2, Trophy, BookOpen, Zap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type QuizType = "topic" | "milestone";

interface QuizQuestion {
  id: string;
  orderIndex: number;
  question: string;
  options: string[];
}

interface GeneratedQuiz {
  attemptId: string;
  quizType: string;
  total: number;
  questions: QuizQuestion[];
}

interface QuizResult {
  questionId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  studentAnswer: string | null;
  isCorrect: boolean;
  explanation: string;
}

interface SubmitResponse {
  attemptId: string;
  score: number;
  total: number;
  percentage: number;
  grade: string;
  results: QuizResult[];
  masteryUpdates: { topicId: string; masteryLevel: number }[];
}

type ModalState = "generating" | "in_progress" | "submitting" | "results";

interface QuizModalProps {
  type: QuizType;
  targetId: string;     // topicId or milestoneId
  subjectId: string;
  targetName: string;   // displayed in header
  onClose: (masteryUpdates?: { topicId: string; masteryLevel: number }[]) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTierColor(pct: number) {
  if (pct >= 80) return "#10b981";
  if (pct >= 60) return "#3b82f6";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

function getTierLabel(grade: string) {
  const map: Record<string, string> = {
    Excellent: "🏆 Excellent!",
    Good: "🎯 Good",
    Average: "📈 Average",
    "Keep Practicing": "💪 Keep Practicing",
  };
  return map[grade] ?? grade;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function QuizModal({ type, targetId, subjectId, targetName, onClose }: QuizModalProps) {
  const [state, setState] = useState<ModalState>("generating");
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId → "A"
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate quiz on mount
  const startQuiz = useCallback(async () => {
    setState("generating");
    setError(null);
    const token = localStorage.getItem("javirs_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500/api";
    try {
      const res = await fetch(`${apiUrl}/quiz/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type, id: targetId, subjectId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: GeneratedQuiz = await res.json();
      setQuiz(data);
      setCurrentIndex(0);
      setAnswers({});
      setSelectedOption(null);
      setState("in_progress");
    } catch (err: any) {
      setError(err.message ?? "Failed to generate quiz");
    }
  }, [type, targetId, subjectId]);

  // Trigger quiz generation on mount
  useEffect(() => {
    startQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Confirm answer + advance
  const handleSelectOption = (letter: string) => {
    if (!quiz) return;
    setSelectedOption(letter);
  };

  const handleNext = () => {
    if (!quiz || selectedOption === null) return;
    const currentQ = quiz.questions[currentIndex];
    const newAnswers = { ...answers, [currentQ.id]: selectedOption };
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handleSubmit = async (finalAnswers: Record<string, string>) => {
    if (!quiz) return;
    setState("submitting");
    const token = localStorage.getItem("javirs_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500/api";
    try {
      const payload = {
        answers: Object.entries(finalAnswers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      };
      const res = await fetch(`${apiUrl}/quiz/attempts/${quiz.attemptId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: SubmitResponse = await res.json();
      setSubmitResult(data);
      setState("results");
    } catch (err: any) {
      setError(err.message ?? "Failed to submit quiz");
      setState("in_progress");
    }
  };

  const currentQ = quiz?.questions[currentIndex];
  const progress = quiz ? ((currentIndex + 1) / quiz.total) * 100 : 0;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden flex flex-col"
        style={{
          maxHeight: "90vh",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border-default)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b"
          style={{
            background: "var(--color-void)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <div className="flex items-center gap-2.5">
            {type === "topic" ? (
              <Zap size={15} style={{ color: "var(--color-accent)" }} />
            ) : (
              <BookOpen size={15} style={{ color: "var(--color-accent)" }} />
            )}
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {type === "topic" ? "Topic Quiz" : "Section Quiz"}
              </p>
              <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                {targetName}
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose()}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")
            }
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* GENERATING state */}
          {state === "generating" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2
                size={32}
                className="animate-spin"
                style={{ color: "var(--color-accent)" }}
              />
              <p className="text-[14px]" style={{ color: "var(--color-text-secondary)" }}>
                AI is generating your quiz questions…
              </p>
              {error && (
                <p className="text-[12px] text-red-400">Error: {error}</p>
              )}
            </div>
          )}

          {/* SUBMITTING state */}
          {state === "submitting" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2
                size={32}
                className="animate-spin"
                style={{ color: "var(--color-accent)" }}
              />
              <p className="text-[14px]" style={{ color: "var(--color-text-secondary)" }}>
                Grading your answers…
              </p>
            </div>
          )}

          {/* IN_PROGRESS state */}
          {state === "in_progress" && quiz && currentQ && (
            <div className="flex flex-col gap-5">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    Question {currentIndex + 1} of {quiz.total}
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--color-accent)" }}>
                    {Math.round(progress)}%
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--color-border-subtle)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: "var(--color-accent)",
                    }}
                  />
                </div>
              </div>

              {/* Question */}
              <p
                className="text-[15px] leading-relaxed font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {currentQ.question}
              </p>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                {currentQ.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D
                  const isSelected = selectedOption === letter;
                  return (
                    <button
                      key={letter}
                      onClick={() => handleSelectOption(letter)}
                      className="w-full text-left px-4 py-3 rounded-xl transition-all duration-150 flex items-start gap-3"
                      style={{
                        background: isSelected
                          ? "rgba(99,102,241,0.15)"
                          : "var(--color-void)",
                        border: `1.5px solid ${isSelected ? "var(--color-accent)" : "var(--color-border-subtle)"}`,
                        color: "var(--color-text-primary)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-default)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
                      }}
                    >
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center"
                        style={{
                          background: isSelected ? "var(--color-accent)" : "var(--color-border-default)",
                          color: isSelected ? "#fff" : "var(--color-text-muted)",
                        }}
                      >
                        {letter}
                      </span>
                      <span className="text-[13.5px] leading-snug pt-0.5">{opt.substring(3)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESULTS state */}
          {state === "results" && submitResult && (
            <div className="flex flex-col gap-5">
              {/* Score banner */}
              <div
                className="flex flex-col items-center py-6 rounded-xl gap-2"
                style={{
                  background: `${getTierColor(submitResult.percentage)}18`,
                  border: `1px solid ${getTierColor(submitResult.percentage)}40`,
                }}
              >
                <Trophy size={32} style={{ color: getTierColor(submitResult.percentage) }} />
                <p
                  className="text-[28px] font-bold"
                  style={{ color: getTierColor(submitResult.percentage) }}
                >
                  {submitResult.percentage}%
                </p>
                <p className="text-[16px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {getTierLabel(submitResult.grade)}
                </p>
                <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                  {submitResult.score} / {submitResult.total} correct
                </p>
              </div>

              {/* Per-question breakdown */}
              <div className="flex flex-col gap-2">
                {submitResult.results.map((r, i) => (
                  <div
                    key={r.questionId}
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: `1px solid ${r.isCorrect ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                      background: r.isCorrect ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                    }}
                  >
                    <div className="flex items-start gap-3 px-4 py-3">
                      {r.isCorrect ? (
                        <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#10b981" }} />
                      ) : (
                        <XCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                          Q{i + 1}. {r.question}
                        </p>
                        {!r.isCorrect && (
                          <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>
                            Your answer: {r.studentAnswer ?? "—"} · Correct: {r.correctAnswer}
                          </p>
                        )}
                        <p
                          className="text-[11px] mt-1.5 leading-relaxed"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {r.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex-shrink-0 px-5 py-4 border-t flex items-center justify-between"
          style={{
            borderColor: "var(--color-border-subtle)",
            background: "var(--color-void)",
          }}
        >
          {state === "in_progress" && quiz && (
            <>
              <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                {Object.keys(answers).length}/{quiz.total} answered
              </span>
              <button
                onClick={handleNext}
                disabled={selectedOption === null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
                style={{
                  background: selectedOption !== null ? "var(--color-accent)" : "var(--color-border-default)",
                  color: selectedOption !== null ? "#fff" : "var(--color-text-muted)",
                  cursor: selectedOption !== null ? "pointer" : "not-allowed",
                }}
              >
                {currentIndex < quiz.total - 1 ? "Next" : "Submit Quiz"}
                <ChevronRight size={14} />
              </button>
            </>
          )}

          {state === "results" && submitResult && (
            <>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#10b981" }}
                />
                <span className="text-[11px]" style={{ color: "#10b981" }}>
                  Progress updated
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startQuiz()}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors"
                  style={{
                    borderColor: "var(--color-border-default)",
                    color: "var(--color-text-secondary)",
                    background: "transparent",
                  }}
                >
                  Try Again
                </button>
                <button
                  onClick={() => onClose(submitResult.masteryUpdates)}
                  className="px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: "var(--color-accent)",
                    color: "#fff",
                  }}
                >
                  Close
                </button>
              </div>
            </>
          )}

          {(state === "generating" || state === "submitting") && (
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => onClose()}
                className="text-[12px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
