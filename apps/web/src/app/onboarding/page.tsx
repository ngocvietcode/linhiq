"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const SUBJECTS = [
  { id: "biology", emoji: "🧬", name: "Biology" },
  { id: "chemistry", emoji: "⚗️", name: "Chemistry" },
  { id: "maths", emoji: "∫", name: "Maths" },
  { id: "physics", emoji: "⚡", name: "Physics" },
  { id: "economics", emoji: "📊", name: "Economics" },
  { id: "geography", emoji: "🌍", name: "Geography" },
];

const DIAGNOSTIC_QUESTIONS = [
  {
    question: "What is the function of the cell membrane?",
    options: [
      "Controls what enters and leaves the cell",
      "Produces energy for the cell",
      "Controls cell division",
      "Stores genetic information",
    ],
    correct: 0,
  },
  {
    question: "Which process converts glucose into energy in cells?",
    options: ["Photosynthesis", "Osmosis", "Respiration", "Diffusion"],
    correct: 2,
  },
  {
    question: "What does DNA stand for?",
    options: [
      "Deoxyribonucleic Acid",
      "Deoxyribose Nucleotide Algorithm",
      "Dynamic Nucleic Array",
      "Deionized Nitrogen Acid",
    ],
    correct: 0,
  },
];

function OnboardingContent() {
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [curriculum, setCurriculum] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [saving, setSaving] = useState(false);

  const totalSteps = 3;

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  function answerDiagnostic(answerIdx: number) {
    const newAnswers = [...diagnosticAnswers, answerIdx];
    setDiagnosticAnswers(newAnswers);
    if (currentQ < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      finishOnboarding(newAnswers);
    }
  }

  async function finishOnboarding(answers?: number[]) {
    setSaving(true);
    try {
      // Save onboarding data if API supports it
      if (token) {
        await api("/users/onboarding", {
          method: "POST",
          token,
          body: {
            curriculum,
            subjects: selectedSubjects,
            diagnosticAnswers: answers || diagnosticAnswers,
          },
        }).catch(() => {}); // non-blocking
      }
    } finally {
      router.push("/dashboard");
    }
  }

  function StepIndicator() {
    return (
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i + 1 === step ? 20 : 8,
              height: 8,
              background: i + 1 <= step ? "var(--color-accent)" : "var(--color-surface-2)",
              border: "1px solid var(--color-border-default)",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-surface-1)" }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-accent-soft), transparent)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="text-xl font-bold">
          <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Step {step} of {totalSteps}
          </span>
          <StepIndicator />
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl animate-fade-up">

          {/* ─── STEP 1: Curriculum ─── */}
          {step === 1 && (
            <div>
              <div className="text-center mb-10">
                <p
                  className="text-4xl mb-4"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  👋
                </p>
                <h1 className="text-3xl font-bold mb-3">
                  Hi, I&apos;m LinhIQ.
                  <br />
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    Your personal AI tutor.
                  </span>
                </h1>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Let me set up your personalised experience.
                </p>
              </div>

              <p className="font-medium mb-4">Which school program are you studying?</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { id: "IGCSE", label: "IGCSE", sub: "Grade 9–10 · Age 14–16" },
                  { id: "A-Level", label: "A-Level", sub: "Grade 11–12 · Age 16–18" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCurriculum(c.id)}
                    className="rounded-xl p-5 text-left transition-all duration-200 border"
                    style={{
                      background:
                        curriculum === c.id
                          ? "var(--color-accent-soft)"
                          : "var(--color-surface-2)",
                      borderColor:
                        curriculum === c.id
                          ? "var(--color-accent)"
                          : "var(--color-border-default)",
                      boxShadow: curriculum === c.id ? "var(--shadow-glow)" : "none",
                    }}
                  >
                    <div className="font-semibold text-lg mb-1">{c.label}</div>
                    <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {c.sub}
                    </div>
                    {curriculum === c.id && (
                      <div
                        className="mt-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "var(--color-accent)" }}
                      >
                        <Check size={12} color="white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!curriculum}
                className="btn-primary w-full"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ─── STEP 2: Subjects ─── */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Which subjects?</h1>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Pick up to 3 subjects to start with.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {SUBJECTS.map((s) => {
                  const selected = selectedSubjects.includes(s.id);
                  const atLimit = selectedSubjects.length >= 3;
                  const dimmed = atLimit && !selected;
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      disabled={dimmed}
                      className="rounded-xl p-4 text-center transition-all duration-200 border relative"
                      style={{
                        background: selected ? "var(--color-accent-soft)" : "var(--color-surface-2)",
                        borderColor: selected
                          ? "var(--color-accent)"
                          : "var(--color-border-subtle)",
                        opacity: dimmed ? 0.4 : 1,
                        cursor: dimmed ? "not-allowed" : "pointer",
                      }}
                    >
                      {selected && (
                        <div
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: "var(--color-accent)" }}
                        >
                          <Check size={10} color="white" />
                        </div>
                      )}
                      <div className="text-2xl mb-1">{s.emoji}</div>
                      <div className="text-xs font-medium">{s.name}</div>
                    </button>
                  );
                })}
              </div>

              <p
                className="text-sm mb-6"
                style={{ color: selectedSubjects.length >= 3 ? "var(--color-warning)" : "var(--color-text-secondary)" }}
              >
                {selectedSubjects.length}/3 selected{selectedSubjects.length >= 3 && " — max reached"}
                {selectedSubjects.length > 0 &&
                  ` — ${selectedSubjects
                    .map((id) => SUBJECTS.find((s) => s.id === id)?.name)
                    .join(", ")}`}
              </p>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1">
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedSubjects.length === 0}
                  className="btn-primary flex-1"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Diagnostic ─── */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Quick diagnostic — 3 questions</h1>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Helps me understand where you are right now.
                </p>
              </div>

              <div
                className="text-xs font-medium mb-4 flex items-center gap-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Biology · Question {currentQ + 1} of {DIAGNOSTIC_QUESTIONS.length}
                <div
                  className="progress-bar flex-1"
                  style={{ height: 4 }}
                >
                  <div
                    className="progress-fill"
                    style={{ width: `${((currentQ + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              <div
                className="rounded-xl p-6 mb-5 border"
                style={{
                  background: "var(--color-surface-2)",
                  borderColor: "var(--color-border-subtle)",
                }}
              >
                <p className="text-lg font-medium mb-6">
                  {DIAGNOSTIC_QUESTIONS[currentQ].question}
                </p>
                <div className="space-y-3">
                  {DIAGNOSTIC_QUESTIONS[currentQ].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => answerDiagnostic(idx)}
                      className="w-full text-left px-4 py-3 rounded-lg border transition-all duration-150"
                      style={{
                        background: "var(--color-surface-2)",
                        borderColor: "var(--color-border-default)",
                        color: "var(--color-text-primary)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "var(--color-accent)";
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--color-accent-soft)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "var(--color-border-default)";
                        (e.currentTarget as HTMLElement).style.background = "var(--color-surface-2)";
                      }}
                    >
                      <span
                        className="font-mono text-xs mr-3"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep(2)} className="btn-ghost">
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={() => finishOnboarding()}
                  disabled={saving}
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Skip diagnostic →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return <OnboardingContent />;
}
