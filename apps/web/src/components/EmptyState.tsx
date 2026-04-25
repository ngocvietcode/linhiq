"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  /** Lucide icon component (preferred) or emoji string (legacy) */
  icon?: LucideIcon | string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === "string") {
      // Legacy emoji support
      return (
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4"
          style={{ background: "var(--color-surface-0)", border: "1px solid var(--color-border-subtle)" }}
        >
          {icon}
        </div>
      );
    }
    // Lucide icon component
    const Icon = icon;
    return (
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--color-accent-soft)", border: "1px solid var(--color-accent-border)" }}
      >
        <Icon size={22} style={{ color: "var(--color-accent)" }} />
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {renderIcon()}
      <p className="font-semibold text-base mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-heading)" }}>
        {title}
      </p>
      {description && (
        <p className="text-sm max-w-xs" style={{ color: "var(--color-text-secondary)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
