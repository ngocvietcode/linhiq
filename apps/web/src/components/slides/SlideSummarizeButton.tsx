"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { SlideDeckPlayer } from "./SlideDeckPlayer";
import type { SlideDeck } from "./types";

type Depth = "quick" | "standard" | "deep";

interface SummarizeBody {
  bookId: string;
  depth: Depth;
  language?: "vi" | "en" | "mix";
  topicId?: string;
  pageStart?: number;
  pageEnd?: number;
}

interface Props {
  bookId: string;
  currentPage: number;
  totalPages: number | null;
  topicId?: string | null;
  topicName?: string | null;
  /** Pages around current to summarise when no topic context */
  defaultRange?: number;
  className?: string;
}

export function SlideSummarizeButton({
  bookId,
  currentPage,
  totalPages,
  topicId,
  topicName,
  defaultRange = 4,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deck, setDeck] = useState<SlideDeck | null>(null);
  const [depth, setDepth] = useState<Depth>("standard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const start = Math.max(1, currentPage - Math.floor(defaultRange / 2));
  const end = Math.min(totalPages ?? currentPage + defaultRange, currentPage + Math.ceil(defaultRange / 2));

  const generate = async () => {
    setLoading(true);
    try {
      const body: SummarizeBody = topicId
        ? { bookId, topicId, depth, language: "vi" }
        : { bookId, pageStart: start, pageEnd: end, depth, language: "vi" };
      const res = await api<{ deckId: string; deck: SlideDeck }>("/slides/summarize", {
        method: "POST",
        body,
      });
      setDeck(res.deck);
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate slides";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const closeDeck = () => setDeck(null);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] hover:bg-[var(--color-accent-border)] border border-[var(--color-accent-border)] text-sm font-medium transition ${className}`}
        aria-label="Summarize as slides"
      >
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">Summarize</span>
      </button>

      {/* Depth chooser modal */}
      {mounted && open && !deck && createPortal(
        <div
          className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full md:max-w-md bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-t-[var(--radius-xl)] md:rounded-[var(--radius-xl)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-5 text-[var(--color-accent)]" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Tóm tắt thành slides
              </h3>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5">
              {topicName
                ? <>Tóm tắt chủ đề <span className="text-[var(--color-text-primary)] font-medium">{topicName}</span></>
                : <>Tóm tắt trang <span className="text-[var(--color-text-primary)] font-medium">{start}–{end}</span></>}
            </p>

            <div className="space-y-2 mb-5">
              {(
                [
                  { key: "quick", label: "Nhanh", hint: "3–4 slide" },
                  { key: "standard", label: "Tiêu chuẩn", hint: "5–7 slide" },
                  { key: "deep", label: "Sâu", hint: "8–10 slide" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDepth(opt.key)}
                  disabled={loading}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border text-left transition ${
                    depth === opt.key
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                      : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)]"
                  }`}
                >
                  <span className="font-medium text-[var(--color-text-primary)]">{opt.label}</span>
                  <span className="text-xs text-[var(--color-text-secondary)]">{opt.hint}</span>
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)] mb-4">
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              <span>Sẽ mất 5–15 giây để Linh sinh slide.</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-0)] hover:bg-[var(--color-card)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] text-sm font-medium transition disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={generate}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang tạo…
                  </>
                ) : (
                  "Tạo slides"
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Player */}
      {mounted && deck && createPortal(
        <SlideDeckPlayer deck={deck} onClose={closeDeck} />,
        document.body
      )}
    </>
  );
}
