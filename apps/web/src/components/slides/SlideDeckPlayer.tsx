"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { SlideRenderer } from "./SlideRenderer";
import type { SlideDeck } from "./types";

interface Props {
  deck: SlideDeck;
  onClose: () => void;
}

const AUTOPLAY_MS = 6500;

export function SlideDeckPlayer({ deck, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const total = deck.slides.length;
  const touchStartX = useRef<number | null>(null);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  // Autoplay
  useEffect(() => {
    if (!autoplay) return;
    const t = setTimeout(() => {
      if (index < total - 1) goNext();
      else setAutoplay(false);
    }, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [autoplay, index, total, goNext]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) goNext();
    else if (dx > 50) goPrev();
    touchStartX.current = null;
  };

  const slide = deck.slides[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={deck.title}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-full max-h-[92vh] md:max-h-[85vh] flex flex-col bg-[var(--color-surface-2)] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-md)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "popupIn 280ms var(--ease-spring, cubic-bezier(0.16,1,0.3,1)) both" }}
      >
        {/* Story-style progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-3 pt-3">
          {deck.slides.map((_, i) => (
            <div
              key={i}
              className="h-0.5 flex-1 rounded-full bg-[var(--color-border-subtle)] overflow-hidden"
            >
              <div
                className="h-full bg-[var(--color-accent)] transition-[width] duration-500 ease-out"
                style={{
                  width: i < index ? "100%" : i === index ? "100%" : "0%",
                  opacity: i === index ? 1 : i < index ? 0.6 : 0.2,
                }}
              />
            </div>
          ))}
        </div>

        {/* Top bar: title + close */}
        <div className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-4">
          <div className="text-xs text-[var(--color-text-secondary)] truncate max-w-[60%]">
            {deck.title}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoplay((v) => !v)}
              className="size-9 rounded-full bg-[var(--color-surface-0)] hover:bg-[var(--color-card)] flex items-center justify-center text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] transition"
              aria-label={autoplay ? "Pause autoplay" : "Start autoplay"}
            >
              {autoplay ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button
              onClick={onClose}
              className="size-9 rounded-full bg-[var(--color-surface-0)] hover:bg-[var(--color-card)] flex items-center justify-center text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] transition"
              aria-label="Close slides"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Slide stage */}
        <div
          className="relative flex-1 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <SlideRenderer slide={slide} slideKey={index} />
        </div>

        {/* Footer: prev / counter / next */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-[var(--color-surface-2)] border-t border-[var(--color-border-subtle)]">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="size-11 rounded-full bg-[var(--color-surface-0)] hover:bg-[var(--color-card)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] transition"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="text-sm text-[var(--color-text-secondary)] tabular-nums">
            {index + 1} / {total}
          </span>
          <button
            onClick={goNext}
            disabled={index >= total - 1}
            className="size-11 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {/* Inline keyframes — local to player to avoid leaking */}
      <style jsx global>{`
        @keyframes slideEnter {
          from {
            opacity: 0;
            transform: translateX(24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideBlockIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes popupIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
