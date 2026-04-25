"use client";

import {
  Atom,
  BookOpen,
  Lightbulb,
  Rocket,
  Globe,
  Calculator,
  Leaf,
  Dna,
  Scale,
  Compass,
  Telescope,
  FlaskConical,
  Brain,
  Beaker,
  Microscope,
  GraduationCap,
  Sigma,
  Heart,
  Zap,
  Sparkles,
  Check,
  ArrowRight,
  Circle,
  Quote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SlideBlock, IconColor } from "./types";

// ─── Icon registry ─────────────────────────────────────────────
// AI emits kebab-case names. Whitelist resolves to imported components;
// unknown names fall back to Sparkles.
const ICON_MAP: Record<string, LucideIcon> = {
  atom: Atom,
  "book-open": BookOpen,
  book: BookOpen,
  lightbulb: Lightbulb,
  rocket: Rocket,
  globe: Globe,
  calculator: Calculator,
  leaf: Leaf,
  dna: Dna,
  scale: Scale,
  compass: Compass,
  telescope: Telescope,
  "flask-conical": FlaskConical,
  flask: FlaskConical,
  brain: Brain,
  beaker: Beaker,
  microscope: Microscope,
  "graduation-cap": GraduationCap,
  sigma: Sigma,
  heart: Heart,
  zap: Zap,
  sparkles: Sparkles,
};

function resolveIcon(name?: string): LucideIcon {
  if (!name) return Sparkles;
  return ICON_MAP[name.toLowerCase()] ?? Sparkles;
}

const ICON_COLOR_CLASS: Record<IconColor, string> = {
  primary: "text-[var(--color-text-primary)]",
  accent: "text-[var(--color-accent)]",
  success: "text-[var(--color-success)]",
  warning: "text-[var(--color-warning)]",
  danger: "text-[var(--color-danger)]",
  muted: "text-[var(--color-text-secondary)]",
};

// ─── Block renderer ────────────────────────────────────────────

interface Props {
  block: SlideBlock;
  index: number;
}

export function BlockRenderer({ block, index }: Props) {
  // Stagger entrance via CSS animation-delay
  const enterStyle = {
    animation: "slideBlockIn 480ms var(--ease-spring, cubic-bezier(0.16,1,0.3,1)) both",
    animationDelay: `${index * 90}ms`,
  } as const;

  switch (block.type) {
    case "title": {
      const sizeClass =
        block.emphasis === "primary"
          ? "text-4xl md:text-5xl font-bold tracking-tight"
          : "text-2xl md:text-3xl font-semibold";
      const colorClass =
        block.emphasis === "accent"
          ? "text-[var(--color-accent)]"
          : block.emphasis === "muted"
            ? "text-[var(--color-text-secondary)]"
            : "text-[var(--color-text-primary)]";
      return (
        <h2 className={`${sizeClass} ${colorClass} text-balance`} style={enterStyle}>
          {block.text}
        </h2>
      );
    }

    case "subtitle":
      return (
        <p
          className="text-lg md:text-xl text-[var(--color-text-secondary)] text-balance"
          style={enterStyle}
        >
          {block.text}
        </p>
      );

    case "body": {
      const sizeClass =
        block.size === "lg" ? "text-xl md:text-2xl" : block.size === "sm" ? "text-sm" : "text-base md:text-lg";
      return (
        <p
          className={`${sizeClass} text-[var(--color-text-primary)] leading-relaxed`}
          style={enterStyle}
        >
          {block.text}
        </p>
      );
    }

    case "bullets":
    case "list": {
      const Marker = ({ idx }: { idx: number }) => {
        if (block.style === "check")
          return <Check className="size-4 text-[var(--color-success)] mt-1.5 shrink-0" />;
        if (block.style === "arrow")
          return <ArrowRight className="size-4 text-[var(--color-accent)] mt-1.5 shrink-0" />;
        if (block.style === "number")
          return (
            <span className="size-5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {idx + 1}
            </span>
          );
        return <Circle className="size-2 fill-[var(--color-accent)] text-[var(--color-accent)] mt-2.5 shrink-0" />;
      };
      return (
        <ul className="space-y-3 w-full max-w-2xl" style={enterStyle}>
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-base md:text-lg text-[var(--color-text-primary)]"
              style={{
                animation: "slideBlockIn 380ms var(--ease-out, ease-out) both",
                animationDelay: `${(index + i) * 80}ms`,
              }}
            >
              <Marker idx={i} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    case "quote":
      return (
        <figure className="max-w-2xl text-center" style={enterStyle}>
          <Quote className="size-8 text-[var(--color-accent)] mx-auto mb-3 opacity-60" />
          <blockquote className="text-xl md:text-2xl italic text-[var(--color-text-primary)] leading-relaxed">
            {block.text}
          </blockquote>
          {block.cite && (
            <figcaption className="mt-3 text-sm text-[var(--color-text-secondary)]">
              — {block.cite}
            </figcaption>
          )}
        </figure>
      );

    case "formula":
      // KaTeX integration deferred to LIQ-205 — show monospace fallback that still reads well.
      return (
        <div className="w-full max-w-2xl text-center" style={enterStyle}>
          <div className="font-mono text-lg md:text-2xl px-6 py-5 rounded-[var(--radius-lg)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] overflow-x-auto">
            {block.latex}
          </div>
          {block.caption && (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{block.caption}</p>
          )}
        </div>
      );

    case "icon": {
      const Icon = resolveIcon(block.name);
      const color = block.color ? ICON_COLOR_CLASS[block.color] : ICON_COLOR_CLASS.accent;
      return (
        <div
          className={`${color} flex items-center justify-center`}
          style={{
            ...enterStyle,
            filter: "drop-shadow(0 0 24px rgba(124,111,253,0.25))",
          }}
        >
          <Icon className="size-24 md:size-32" strokeWidth={1.5} />
        </div>
      );
    }

    case "comparison":
      return (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl"
          style={enterStyle}
        >
          {[
            { side: block.left, accent: "var(--color-accent)" },
            { side: block.right, accent: "var(--color-teal)" },
          ].map(({ side, accent }, colIdx) => (
            <div
              key={colIdx}
              className="rounded-[var(--radius-lg)] p-5 border bg-[var(--color-card)]"
              style={{
                borderColor: accent,
                animation: "slideBlockIn 480ms var(--ease-spring, cubic-bezier(0.16,1,0.3,1)) both",
                animationDelay: `${(index + colIdx) * 120}ms`,
              }}
            >
              <h4
                className="text-sm font-semibold uppercase tracking-wide mb-3"
                style={{ color: accent }}
              >
                {side.label}
              </h4>
              <ul className="space-y-2">
                {side.items.map((item, i) => (
                  <li key={i} className="text-sm md:text-base text-[var(--color-text-primary)]">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case "timeline":
      return (
        <ol className="w-full max-w-3xl space-y-4" style={enterStyle}>
          {block.steps.map((step, i) => {
            const Icon = resolveIcon(step.icon);
            return (
              <li
                key={i}
                className="flex items-start gap-4"
                style={{
                  animation: "slideBlockIn 420ms var(--ease-spring, cubic-bezier(0.16,1,0.3,1)) both",
                  animationDelay: `${(index + i) * 110}ms`,
                }}
              >
                <div className="relative shrink-0">
                  <div className="size-10 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
                    <Icon className="size-5" />
                  </div>
                  {i < block.steps.length - 1 && (
                    <div className="absolute left-1/2 top-10 w-px h-6 -translate-x-1/2 bg-[var(--color-border-default)]" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <h5 className="font-semibold text-[var(--color-text-primary)]">{step.label}</h5>
                  {step.desc && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{step.desc}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      );

    case "mnemonic":
      return (
        <div className="flex flex-wrap gap-3 justify-center max-w-3xl" style={enterStyle}>
          {block.letters.map((l, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-0)] border border-[var(--color-accent-border)] min-w-[80px]"
              style={{
                animation: "slideBlockIn 460ms var(--ease-spring, cubic-bezier(0.16,1,0.3,1)) both",
                animationDelay: `${(index + i) * 100}ms`,
              }}
            >
              <span className="text-3xl font-bold text-[var(--color-accent)]">{l.char}</span>
              <span className="text-xs text-[var(--color-text-secondary)]">{l.word}</span>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}
