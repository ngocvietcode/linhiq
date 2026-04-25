"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Bookmark,
  StickyNote,
} from "lucide-react";

const ZOOM_STEPS = [25, 50, 75, 100, 125, 150, 175, 200, 250, 300];

export type ZoomValue = number | "fit" | "fit-width";

interface Props {
  currentPage: number;
  totalPages: number | null;
  zoom: ZoomValue;
  bookmarked: boolean;
  hasNote: boolean;
  onPageChange: (page: number) => void;
  onZoomChange: (z: ZoomValue) => void;
  onToggleBookmark: () => void;
  onOpenNote: () => void;
}

export function FloatingPageNav({
  currentPage,
  totalPages,
  zoom,
  bookmarked,
  hasNote,
  onPageChange,
  onZoomChange,
  onToggleBookmark,
  onOpenNote,
}: Props) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const commitInput = () => {
    const n = parseInt(pageInput);
    if (!isNaN(n)) onPageChange(n);
    else setPageInput(String(currentPage));
  };

  const zoomIn = () => {
    if (zoom === "fit" || zoom === "fit-width") return onZoomChange(125);
    onZoomChange(ZOOM_STEPS.find((s) => s > zoom) ?? 300);
  };
  const zoomOut = () => {
    if (zoom === "fit" || zoom === "fit-width") return onZoomChange(75);
    onZoomChange([...ZOOM_STEPS].reverse().find((s) => s < zoom) ?? 25);
  };

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 flex items-center gap-1 rounded-full border shadow-lg px-1.5 py-1.5"
      style={{
        background: "var(--color-surface-2)",
        borderColor: "var(--color-border-subtle)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-1.5 rounded-full transition-colors disabled:opacity-30 hover:bg-[var(--color-surface-0)]"
        style={{ color: "var(--color-text-primary)" }}
        title="Trang trước (←)"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page input */}
      <div className="flex items-center gap-1 px-1">
        <input
          type="number"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onBlur={commitInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitInput();
          }}
          className="w-10 text-center text-xs font-semibold rounded outline-none bg-transparent"
          style={{ color: "var(--color-text-primary)" }}
          min={1}
          max={totalPages ?? 9999}
        />
        {totalPages && (
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            / {totalPages}
          </span>
        )}
      </div>

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={totalPages !== null && currentPage >= totalPages}
        className="p-1.5 rounded-full transition-colors disabled:opacity-30 hover:bg-[var(--color-surface-0)]"
        style={{ color: "var(--color-text-primary)" }}
        title="Trang kế (→)"
      >
        <ChevronRight size={16} />
      </button>

      {/* Divider */}
      <div
        className="w-px h-5 mx-0.5"
        style={{ background: "var(--color-border-subtle)" }}
      />

      {/* Bookmark */}
      <button
        onClick={onToggleBookmark}
        className="p-1.5 rounded-full transition-colors hover:bg-[var(--color-surface-0)]"
        style={{
          color: bookmarked ? "var(--color-accent)" : "var(--color-text-muted)",
        }}
        title={bookmarked ? "Bỏ đánh dấu" : "Đánh dấu trang"}
      >
        <Bookmark size={15} fill={bookmarked ? "currentColor" : "none"} />
      </button>

      {/* Note */}
      <button
        onClick={onOpenNote}
        className="p-1.5 rounded-full transition-colors hover:bg-[var(--color-surface-0)]"
        style={{
          color: hasNote ? "var(--color-accent)" : "var(--color-text-muted)",
        }}
        title={hasNote ? "Sửa ghi chú" : "Thêm ghi chú"}
      >
        <StickyNote size={15} fill={hasNote ? "currentColor" : "none"} />
      </button>

      {/* Divider */}
      <div
        className="w-px h-5 mx-0.5"
        style={{ background: "var(--color-border-subtle)" }}
      />

      {/* Zoom */}
      <button
        onClick={zoomOut}
        disabled={typeof zoom === "number" && zoom <= 25}
        className="p-1.5 rounded-full transition-colors disabled:opacity-30 hover:bg-[var(--color-surface-0)]"
        style={{ color: "var(--color-text-primary)" }}
        title="Thu nhỏ (Ctrl+-)"
      >
        <ZoomOut size={14} />
      </button>

      <select
        value={zoom}
        onChange={(e) => {
          const v = e.target.value;
          onZoomChange(v === "fit" || v === "fit-width" ? v : Number(v));
        }}
        className="text-[11px] rounded-full px-2 py-1 outline-none cursor-pointer bg-transparent"
        style={{ color: "var(--color-text-primary)" }}
        title="Mức zoom"
      >
        <option value="fit">Fit</option>
        <option value="fit-width">Width</option>
        {ZOOM_STEPS.map((z) => (
          <option key={z} value={z}>
            {z}%
          </option>
        ))}
      </select>

      <button
        onClick={zoomIn}
        disabled={zoom === 300}
        className="p-1.5 rounded-full transition-colors disabled:opacity-30 hover:bg-[var(--color-surface-0)]"
        style={{ color: "var(--color-text-primary)" }}
        title="Phóng to (Ctrl+=)"
      >
        <ZoomIn size={14} />
      </button>
    </div>
  );
}
