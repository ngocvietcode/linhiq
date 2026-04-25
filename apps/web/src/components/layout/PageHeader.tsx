"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Page title rendered in serif heading font */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Optional right-side content (actions, buttons) */
  actions?: ReactNode;
  /** Show thin rule below header (default: true) */
  rule?: boolean;
}

/**
 * PageHeader — standardized page title with optional subtitle and actions
 * Uses serif heading font for academic feel
 */
export function PageHeader({ title, subtitle, actions, rule = true }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      {rule && <div className="page-header-rule" />}
    </div>
  );
}
