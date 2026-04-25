"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { StickyNote, X, Trash2, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  pageNumber: number;
  initialContent: string;
  noteId: string | null;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function NoteEditor({
  open,
  pageNumber,
  initialContent,
  noteId,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      // Autofocus after paint
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open, initialContent]);

  if (!mounted || !open) return null;

  const handleSave = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(content.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => !saving && !deleting && onClose()}
    >
      <div
        className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border p-5"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border-subtle)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-accent-soft)" }}
          >
            <StickyNote size={14} style={{ color: "var(--color-accent)" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold leading-tight">
              {noteId ? "Sửa ghi chú" : "Thêm ghi chú"}
            </h3>
            <p
              className="text-[11px] leading-tight"
              style={{ color: "var(--color-text-muted)" }}
            >
              Trang {pageNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving || deleting}
            className="p-1 rounded transition-colors disabled:opacity-50"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={15} />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="Ghi chú của bạn về trang này..."
          rows={6}
          maxLength={4000}
          className="w-full text-sm rounded-lg p-3 resize-none outline-none border"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-primary)",
            minHeight: 140,
          }}
        />

        <div className="flex items-center justify-between mt-2">
          <span
            className="text-[10px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            {content.length}/4000 · Ctrl+Enter để lưu
          </span>
        </div>

        <div className="flex gap-2 mt-4">
          {noteId && onDelete && (
            <button
              onClick={handleDelete}
              disabled={saving || deleting}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              style={{
                background: "var(--color-surface-0)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Xoá
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={saving || deleting}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            style={{
              background: "var(--color-surface-0)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving || deleting}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
            }}
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Lưu
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
