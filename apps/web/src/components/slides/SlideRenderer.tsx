"use client";

import { BlockRenderer } from "./blocks";
import type { Slide } from "./types";

interface Props {
  slide: Slide;
  slideKey: string | number;
}

const BACKGROUND_CLASS: Record<NonNullable<Slide["background"]>, string> = {
  plain: "bg-[var(--color-surface-2)]",
  "gradient-primary":
    "bg-[radial-gradient(ellipse_at_top,_var(--color-accent-soft)_0%,_var(--color-surface-2)_60%)]",
  "gradient-accent":
    "bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-teal-dim)_0%,_var(--color-surface-2)_55%)]",
  "pattern-grid":
    "bg-[var(--color-surface-2)] [background-image:linear-gradient(var(--color-border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--color-border-subtle)_1px,transparent_1px)] [background-size:32px_32px]",
};

export function SlideRenderer({ slide, slideKey }: Props) {
  const bgClass = BACKGROUND_CLASS[slide.background ?? "plain"];

  // Layout governs alignment + arrangement; blocks themselves stay layout-agnostic.
  const layoutClass = (() => {
    switch (slide.layout) {
      case "title-cover":
        return "flex flex-col items-center justify-center text-center gap-4";
      case "centered":
        return "flex flex-col items-center justify-center text-center gap-5";
      case "two-column":
        return "grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-items-center";
      case "timeline":
        return "flex flex-col items-start justify-center gap-5";
      case "comparison":
        return "flex flex-col items-center justify-center gap-5";
      case "quote":
        return "flex flex-col items-center justify-center gap-3";
      case "mnemonic":
        return "flex flex-col items-center justify-center gap-5";
      case "bullets":
        return "flex flex-col items-start justify-center gap-5";
      default:
        return "flex flex-col items-center justify-center gap-4";
    }
  })();

  return (
    <div
      key={slideKey}
      className={`absolute inset-0 ${bgClass} px-6 md:px-12 py-12 md:py-16 overflow-y-auto`}
      style={{ animation: "slideEnter 360ms var(--ease-out, ease-out) both" }}
    >
      <div className={`min-h-full max-w-4xl mx-auto ${layoutClass}`}>
        {slide.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} index={i} />
        ))}
      </div>
    </div>
  );
}
