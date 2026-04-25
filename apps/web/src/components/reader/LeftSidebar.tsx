"use client";

import { useState } from "react";
import { Library, ListTree, Bookmark, X, Trash2 } from "lucide-react";

export interface BookVolume {
  id: string;
  title: string;
  shortTitle: string;
  bookType: string;
  isDefault: boolean;
  totalPages: number | null;
  coverColor: string | null;
  subjectId: string;
}

export interface TocEntry {
  chapterName: string;
  topicName: string | null;
  topicId: string | null;
  startPage: number;
}

const BOOK_ICONS: Record<string, string> = {
  COURSEBOOK: "📗",
  WORKBOOK: "📘",
  REVISION_GUIDE: "📙",
  PAST_PAPER: "📝",
  SYLLABUS: "📋",
  TEACHER_GUIDE: "👩‍🏫",
};

type Tab = "books" | "toc" | "bookmarks";

interface Props {
  books: BookVolume[];
  activeBook: BookVolume | null;
  onSelectBook: (book: BookVolume) => void;
  toc: TocEntry[];
  currentTopicId: string | null;
  bookmarks: number[];
  currentPage: number;
  onJumpPage: (page: number) => void;
  onRemoveBookmark: (page: number) => void;
  onClose?: () => void;
}

export function LeftSidebar({
  books,
  activeBook,
  onSelectBook,
  toc,
  currentTopicId,
  bookmarks,
  currentPage,
  onJumpPage,
  onRemoveBookmark,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>("toc");

  return (
    <div
      className="flex h-full"
      style={{ background: "var(--color-surface-1)" }}
    >
      {/* Tab rail */}
      <div
        className="flex flex-col items-center gap-1 py-3 px-1 border-r flex-shrink-0"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        {(
          [
            { key: "books", icon: Library, label: "Sách" },
            { key: "toc", icon: ListTree, label: "Mục lục" },
            { key: "bookmarks", icon: Bookmark, label: "Đánh dấu" },
          ] as const
        ).map(({ key, icon: Icon, label }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: active ? "var(--color-accent-soft)" : "transparent",
                color: active ? "var(--color-accent)" : "var(--color-text-muted)",
              }}
              title={label}
            >
              <Icon size={17} />
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {tab === "books" && "Sách trong môn học"}
            {tab === "toc" && "Mục lục"}
            {tab === "bookmarks" && "Đã đánh dấu"}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded transition-colors md:hidden"
              style={{ color: "var(--color-text-muted)" }}
              aria-label="Close sidebar"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {tab === "books" && (
            <BooksTab books={books} activeBook={activeBook} onSelectBook={onSelectBook} />
          )}
          {tab === "toc" && (
            <TocTab
              toc={toc}
              currentTopicId={currentTopicId}
              onJumpPage={onJumpPage}
            />
          )}
          {tab === "bookmarks" && (
            <BookmarksTab
              bookmarks={bookmarks}
              currentPage={currentPage}
              onJumpPage={onJumpPage}
              onRemove={onRemoveBookmark}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BooksTab({
  books,
  activeBook,
  onSelectBook,
}: {
  books: BookVolume[];
  activeBook: BookVolume | null;
  onSelectBook: (b: BookVolume) => void;
}) {
  if (books.length === 0) {
    return (
      <p
        className="text-xs px-4 py-6 text-center"
        style={{ color: "var(--color-text-muted)" }}
      >
        Chưa có sách
      </p>
    );
  }
  return (
    <div className="px-2 space-y-1">
      {books.map((book) => {
        const active = activeBook?.id === book.id;
        const icon = BOOK_ICONS[book.bookType] ?? "📚";
        return (
          <button
            key={book.id}
            onClick={() => onSelectBook(book)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors"
            style={{
              background: active
                ? "var(--color-accent-soft)"
                : "transparent",
              border: active
                ? "1px solid var(--color-accent-border)"
                : "1px solid transparent",
            }}
          >
            <span
              className="w-8 h-8 rounded-md flex items-center justify-center text-base flex-shrink-0"
              style={{
                background: book.coverColor ?? "var(--color-surface-0)",
                color: book.coverColor ? "#fff" : "inherit",
              }}
            >
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-semibold truncate"
                style={{
                  color: active
                    ? "var(--color-accent)"
                    : "var(--color-text-primary)",
                }}
              >
                {book.shortTitle}
              </div>
              <div
                className="text-[11px] truncate mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {book.totalPages ? `${book.totalPages} trang` : book.bookType}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TocTab({
  toc,
  currentTopicId,
  onJumpPage,
}: {
  toc: TocEntry[];
  currentTopicId: string | null;
  onJumpPage: (p: number) => void;
}) {
  if (toc.length === 0) {
    return (
      <p
        className="text-xs px-4 py-6 text-center"
        style={{ color: "var(--color-text-muted)" }}
      >
        Chưa có mục lục
      </p>
    );
  }
  return (
    <div>
      {toc.map((entry, i) => {
        const isCurrent = currentTopicId && entry.topicId === currentTopicId;
        return (
          <button
            key={i}
            onClick={() => onJumpPage(entry.startPage)}
            className="w-full text-left px-4 py-2.5 text-xs transition-colors"
            style={{
              color: isCurrent
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
              borderLeft: isCurrent
                ? "3px solid var(--color-accent)"
                : "3px solid transparent",
              background: isCurrent ? "var(--color-accent-soft)" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isCurrent)
                (e.currentTarget as HTMLElement).style.background =
                  "var(--color-surface-0)";
            }}
            onMouseLeave={(e) => {
              if (!isCurrent)
                (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <div className="font-medium leading-snug">{entry.chapterName}</div>
            {entry.topicName && (
              <div
                className="text-[11px] mt-0.5 leading-snug"
                style={{ color: "var(--color-text-muted)" }}
              >
                {entry.topicName}
              </div>
            )}
            <div
              className="text-[10px] mt-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              p. {entry.startPage}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function BookmarksTab({
  bookmarks,
  currentPage,
  onJumpPage,
  onRemove,
}: {
  bookmarks: number[];
  currentPage: number;
  onJumpPage: (p: number) => void;
  onRemove: (p: number) => void;
}) {
  if (bookmarks.length === 0) {
    return (
      <div
        className="text-xs px-4 py-6 text-center space-y-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        <Bookmark size={20} className="mx-auto opacity-40" />
        <p>Chưa có trang nào được đánh dấu.</p>
        <p className="text-[11px]">Bấm vào biểu tượng dấu trang ở thanh điều hướng để lưu trang.</p>
      </div>
    );
  }
  return (
    <div className="px-2 space-y-1">
      {bookmarks.map((page) => {
        const isCurrent = page === currentPage;
        return (
          <div
            key={page}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
            style={{
              background: isCurrent
                ? "var(--color-accent-soft)"
                : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isCurrent)
                (e.currentTarget as HTMLElement).style.background =
                  "var(--color-surface-0)";
            }}
            onMouseLeave={(e) => {
              if (!isCurrent)
                (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <button
              onClick={() => onJumpPage(page)}
              className="flex-1 flex items-center gap-2 text-xs text-left"
            >
              <Bookmark
                size={13}
                style={{ color: "var(--color-accent)" }}
                fill="currentColor"
              />
              <span
                style={{
                  color: isCurrent
                    ? "var(--color-accent)"
                    : "var(--color-text-primary)",
                  fontWeight: isCurrent ? 600 : 500,
                }}
              >
                Trang {page}
              </span>
            </button>
            <button
              onClick={() => onRemove(page)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--color-text-muted)" }}
              aria-label="Remove bookmark"
            >
              <Trash2 size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
