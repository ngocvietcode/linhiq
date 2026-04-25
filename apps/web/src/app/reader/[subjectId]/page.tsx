"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  BookOpen,
  PanelLeft,
  PanelRight,
  Sparkles,
} from "lucide-react";
import { SlideSummarizeButton } from "@/components/slides/SlideSummarizeButton";
import {
  LeftSidebar,
  type BookVolume,
  type TocEntry,
} from "@/components/reader/LeftSidebar";
import { FloatingPageNav, type ZoomValue } from "@/components/reader/FloatingPageNav";
import { AiPanel, type ChatMessage } from "@/components/reader/AiPanel";
import { NoteEditor } from "@/components/reader/NoteEditor";
import {
  getMaxPageReached,
  setMaxPageReached,
  getLastPage,
  setLastPage,
  fetchBookmarks,
  createBookmark,
  deleteBookmarkByPage,
  fetchNotes,
  upsertNote,
  deleteNote,
  type Bookmark,
  type Note,
} from "@/lib/reader-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500/api";

interface PageContext {
  pageNumber: number;
  topicId: string | null;
  topicName: string | null;
  chapterName: string | null;
  bookVolumeId: string;
}

interface RagSourceMeta {
  chunkId: string;
  documentTitle: string;
  content: string;
  similarity: number;
  page: number | null;
}

export default function ReaderPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  // Books
  const [books, setBooks] = useState<BookVolume[]>([]);
  const [activeBook, setActiveBook] = useState<BookVolume | null>(null);
  const [booksLoaded, setBooksLoaded] = useState(false);

  // Page state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // ToC
  const [toc, setToc] = useState<TocEntry[]>([]);

  // Layout panels
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Reading progress + bookmarks + notes
  const [maxReached, setMaxReached] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);

  // Zoom
  const [zoom, setZoom] = useState<ZoomValue>("fit");
  const viewerRef = useRef<HTMLDivElement>(null);

  // Chat
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // ── Responsive defaults ──
  useEffect(() => {
    const apply = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 1024) {
        setLeftOpen(false);
        setRightOpen(false);
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // ── Load books ──
  useEffect(() => {
    if (!token || !subjectId) return;
    setBooksLoaded(false);
    api<BookVolume[]>(`/textbooks?subjectId=${subjectId}`, { token })
      .then((data) => {
        setBooks(data);
        setBooksLoaded(true);
        const defaultBook = data.find((b) => b.isDefault) ?? data[0];
        if (defaultBook) setActiveBook(defaultBook);
      })
      .catch(() => {
        setBooks([]);
        setBooksLoaded(true);
      });
  }, [token, subjectId]);

  // ── Load ToC + restore last page + bookmarks/notes/progress when book changes ──
  useEffect(() => {
    if (!token || !activeBook) return;
    const startPage = getLastPage(activeBook.id) ?? 1;
    setCurrentPage(startPage);
    setZoom("fit");
    setMaxReached(getMaxPageReached(activeBook.id));

    api<TocEntry[]>(`/textbooks/${activeBook.id}/toc`, { token })
      .then(setToc)
      .catch(() => setToc([]));

    fetchBookmarks(activeBook.id)
      .then(setBookmarks)
      .catch(() => setBookmarks([]));
    fetchNotes(activeBook.id)
      .then(setNotes)
      .catch(() => setNotes([]));
  }, [token, activeBook]);

  // ── Ctrl+wheel zoom ──
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => {
        if (e.deltaY < 0) {
          if (z === "fit" || z === "fit-width") return 125;
          const steps = [25, 50, 75, 100, 125, 150, 175, 200, 250, 300];
          return steps.find((s) => s > z) ?? 300;
        } else {
          if (z === "fit" || z === "fit-width") return 75;
          const steps = [25, 50, 75, 100, 125, 150, 175, 200, 250, 300];
          return [...steps].reverse().find((s) => s < z) ?? 25;
        }
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // ── Load page image + context ──
  useEffect(() => {
    if (!token || !activeBook) return;

    setImgLoading(true);
    setImgError(false);

    const controller = new AbortController();
    const url = `${API_URL}/textbooks/${activeBook.id}/pages/${currentPage}/img`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Page not found");
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        setImgSrc(objUrl);
        setImgLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setImgError(true);
          setImgLoading(false);
        }
      });

    api<PageContext>(
      `/textbooks/${activeBook.id}/pages/${currentPage}/context`,
      { token }
    )
      .then(setPageContext)
      .catch(() => setPageContext(null));

    // Persist progress
    setLastPage(activeBook.id, currentPage);
    setMaxReached(setMaxPageReached(activeBook.id, currentPage));

    return () => {
      controller.abort();
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeBook, currentPage]);

  // ── Create chat session ──
  useEffect(() => {
    if (!token || !subjectId) return;
    api<{ id: string }>("/chat/sessions", {
      token,
      method: "POST",
      body: { subjectId },
    })
      .then((s) => setChatSessionId(s.id))
      .catch(() => {});
  }, [token, subjectId]);

  // ── Navigation ──
  const totalPages = activeBook?.totalPages ?? null;

  const goToPage = useCallback(
    (page: number) => {
      if (!totalPages) {
        setCurrentPage(Math.max(1, page));
        return;
      }
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
    },
    [totalPages]
  );

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoom((z) => {
            if (z === "fit" || z === "fit-width") return 125;
            const steps = [25, 50, 75, 100, 125, 150, 175, 200, 250, 300];
            return steps.find((s) => s > z) ?? 300;
          });
          return;
        }
        if (e.key === "-") {
          e.preventDefault();
          setZoom((z) => {
            if (z === "fit" || z === "fit-width") return 75;
            const steps = [25, 50, 75, 100, 125, 150, 175, 200, 250, 300];
            return [...steps].reverse().find((s) => s < z) ?? 25;
          });
          return;
        }
        if (e.key === "0") {
          e.preventDefault();
          setZoom("fit");
          return;
        }
      }
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "PageDown")
        goToPage(currentPage + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp")
        goToPage(currentPage - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPage, goToPage]);

  // ── Bookmarks ──
  const handleToggleBookmark = useCallback(async () => {
    if (!activeBook) return;
    const existing = bookmarks.find((b) => b.pageNumber === currentPage);
    if (existing) {
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      try {
        await deleteBookmarkByPage(activeBook.id, currentPage);
      } catch {
        // Reload on error
        fetchBookmarks(activeBook.id).then(setBookmarks).catch(() => {});
      }
    } else {
      try {
        const created = await createBookmark(activeBook.id, currentPage);
        setBookmarks((prev) =>
          [...prev.filter((b) => b.id !== created.id), created].sort(
            (a, b) => a.pageNumber - b.pageNumber,
          ),
        );
      } catch {
        /* ignore */
      }
    }
  }, [activeBook, currentPage, bookmarks]);

  const handleRemoveBookmark = useCallback(
    async (page: number) => {
      if (!activeBook) return;
      setBookmarks((prev) => prev.filter((b) => b.pageNumber !== page));
      try {
        await deleteBookmarkByPage(activeBook.id, page);
      } catch {
        fetchBookmarks(activeBook.id).then(setBookmarks).catch(() => {});
      }
    },
    [activeBook],
  );

  // ── Notes ──
  const noteForCurrentPage =
    notes.find((n) => n.pageNumber === currentPage) ?? null;

  const handleOpenNote = useCallback(() => {
    setEditingNote(noteForCurrentPage);
    setNoteEditorOpen(true);
  }, [noteForCurrentPage]);

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setNoteEditorOpen(true);
  }, []);

  const handleSaveNote = useCallback(
    async (content: string) => {
      if (!activeBook) return;
      const targetPage = editingNote?.pageNumber ?? currentPage;
      const saved = await upsertNote(activeBook.id, targetPage, content);
      setNotes((prev) => {
        const filtered = prev.filter((n) => n.id !== saved.id);
        return [...filtered, saved].sort((a, b) => a.pageNumber - b.pageNumber);
      });
    },
    [activeBook, editingNote, currentPage],
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      try {
        await deleteNote(noteId);
      } catch {
        if (activeBook) fetchNotes(activeBook.id).then(setNotes).catch(() => {});
      }
    },
    [activeBook],
  );

  // ── Send chat ──
  const sendMessage = useCallback(
    async (overrideContent?: string) => {
      const content = (overrideContent ?? chatInput).trim();
      if (!content || isStreaming || !token || !chatSessionId) return;

      setChatInput("");
      setIsStreaming(true);
      setStreamingText("");

      setChatMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", content },
      ]);

      try {
        const res = await fetch(
          `${API_URL}/chat/sessions/${chatSessionId}/message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              content,
              hintLevel: 1,
              readerContext: pageContext
                ? {
                    bookVolumeId: pageContext.bookVolumeId,
                    topicId: pageContext.topicId,
                    pageNumber: pageContext.pageNumber,
                    topicName: pageContext.topicName,
                    chapterName: pageContext.chapterName,
                  }
                : undefined,
            }),
          }
        );

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let sources: RagSourceMeta[] | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text") {
                fullText += data.content;
                setStreamingText(fullText);
              } else if (data.type === "done") {
                sources = data.metadata?.ragSources as RagSourceMeta[] | undefined;
                setChatMessages((prev) => [
                  ...prev,
                  {
                    id: `a-${Date.now()}`,
                    role: "assistant",
                    content: fullText,
                    sources: sources?.map((s) => ({
                      chunkId: s.chunkId,
                      documentTitle: s.documentTitle,
                      page: s.page ?? null,
                    })),
                  },
                ]);
                setStreamingText("");
              }
            } catch {
              /* skip malformed */
            }
          }
        }
      } catch {
        setStreamingText("");
        setChatMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "⚠️ Lỗi kết nối — vui lòng thử lại.",
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [chatInput, isStreaming, token, chatSessionId, pageContext]
  );

  // ── Loading state ──
  if (authLoading || !booksLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-surface-2)" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--color-accent)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (booksLoaded && books.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: "var(--color-surface-2)" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{
            background: "var(--color-surface)",
            color: "var(--color-text-muted)",
          }}
        >
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Không tìm thấy tài liệu</h2>
        <p
          className="text-sm mb-6 max-w-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          Chưa có sách nào được ánh xạ cho môn học này.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  const progressPct = totalPages
    ? Math.round((maxReached / totalPages) * 100)
    : 0;
  const currentBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);
  const currentHasNote = !!noteForCurrentPage;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--color-surface-2)" }}
    >
      {/* ── Header ── */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-3 md:px-4 py-2.5 border-b"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border-subtle)",
          minHeight: "52px",
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={{ color: "var(--color-text-muted)" }}
          title="Về Dashboard"
        >
          <ArrowLeft size={18} />
        </button>

        <button
          onClick={() => setLeftOpen((o) => !o)}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={{
            color: leftOpen ? "var(--color-accent)" : "var(--color-text-muted)",
            background: leftOpen ? "var(--color-accent-soft)" : "transparent",
          }}
          title="Sách & Mục lục"
        >
          <PanelLeft size={17} />
        </button>

        {/* Book title + topic + progress */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold truncate"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {activeBook?.shortTitle ?? "Reader"}
              </span>
              {pageContext?.chapterName && (
                <span
                  className="hidden md:inline text-xs truncate"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  · {pageContext.chapterName}
                  {pageContext.topicName && ` › ${pageContext.topicName}`}
                </span>
              )}
            </div>
            {totalPages && (
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="h-1 rounded-full overflow-hidden flex-1 max-w-[200px]"
                  style={{ background: "var(--color-border-subtle)" }}
                >
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${progressPct}%`,
                      background: "var(--color-accent)",
                    }}
                  />
                </div>
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {maxReached}/{totalPages}
                </span>
              </div>
            )}
          </div>
        </div>

        {activeBook && (
          <SlideSummarizeButton
            bookId={activeBook.id}
            currentPage={currentPage}
            totalPages={activeBook.totalPages}
            topicId={pageContext?.topicId ?? null}
            topicName={pageContext?.topicName ?? null}
            className="flex-shrink-0"
          />
        )}

        <button
          onClick={() => setRightOpen((o) => !o)}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={{
            color: rightOpen ? "var(--color-accent)" : "var(--color-text-muted)",
            background: rightOpen ? "var(--color-accent-soft)" : "transparent",
          }}
          title="Linh AI"
        >
          {rightOpen ? <PanelRight size={17} /> : <Sparkles size={17} />}
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left sidebar */}
        {leftOpen && (
          <>
            {/* Mobile backdrop */}
            <div
              className="md:hidden absolute inset-0 z-30 bg-black/40"
              onClick={() => setLeftOpen(false)}
            />
            <aside
              className="absolute md:relative z-40 md:z-auto h-full flex-shrink-0 border-r"
              style={{
                width: 300,
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <LeftSidebar
                books={books}
                activeBook={activeBook}
                onSelectBook={(b) => setActiveBook(b)}
                toc={toc}
                currentTopicId={pageContext?.topicId ?? null}
                bookmarks={bookmarks}
                notes={notes}
                currentPage={currentPage}
                onJumpPage={(p) => {
                  goToPage(p);
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setLeftOpen(false);
                  }
                }}
                onRemoveBookmark={handleRemoveBookmark}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                onClose={() => setLeftOpen(false)}
              />
            </aside>
          </>
        )}

        {/* Center viewer */}
        <div className="flex-1 min-w-0 relative flex flex-col">
          <div
            ref={viewerRef}
            className="flex-1 overflow-auto"
            style={{ background: "var(--color-surface-2)" }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                minHeight: "100%",
                minWidth: "100%",
                padding:
                  typeof zoom === "number" && zoom > 100 ? "32px" : "16px",
                paddingBottom: "80px",
              }}
            >
              {imgLoading && (
                <div
                  className="w-10 h-10 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "var(--color-accent)",
                    borderTopColor: "transparent",
                  }}
                />
              )}
              {imgError && !imgLoading && (
                <div
                  className="text-center py-16"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Trang không khả dụng</p>
                  <p className="text-xs mt-1 opacity-60">
                    Hãy chạy script ingest để xử lý sách này
                  </p>
                </div>
              )}
              {imgSrc && !imgLoading && !imgError && (
                <img
                  src={imgSrc}
                  alt={`Trang ${currentPage}`}
                  className="rounded shadow-lg select-none"
                  style={
                    zoom === "fit"
                      ? {
                          maxWidth: "100%",
                          maxHeight: "calc(100vh - 160px)",
                          objectFit: "contain",
                          pointerEvents: "none",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                        }
                      : zoom === "fit-width"
                      ? {
                          width: "100%",
                          maxWidth: "none",
                          height: "auto",
                          pointerEvents: "none",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                        }
                      : {
                          width: `${zoom}%`,
                          maxWidth: "none",
                          height: "auto",
                          pointerEvents: "none",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                        }
                  }
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}
            </div>
          </div>

          <FloatingPageNav
            currentPage={currentPage}
            totalPages={totalPages}
            zoom={zoom}
            bookmarked={currentBookmarked}
            hasNote={currentHasNote}
            onPageChange={goToPage}
            onZoomChange={setZoom}
            onToggleBookmark={handleToggleBookmark}
            onOpenNote={handleOpenNote}
          />
        </div>

        {/* Right AI panel */}
        {rightOpen && (
          <>
            <div
              className="md:hidden absolute inset-0 z-30 bg-black/40"
              onClick={() => setRightOpen(false)}
            />
            <aside
              className="absolute md:relative right-0 z-40 md:z-auto h-full flex-shrink-0 border-l"
              style={{
                width: "min(420px, 100%)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <AiPanel
                pageNumber={currentPage}
                topicName={pageContext?.topicName ?? null}
                chapterName={pageContext?.chapterName ?? null}
                bookShortTitle={activeBook?.shortTitle ?? null}
                messages={chatMessages}
                streamingText={streamingText}
                isStreaming={isStreaming}
                input={chatInput}
                onInputChange={setChatInput}
                onSend={(override) => sendMessage(override)}
                onClose={() => setRightOpen(false)}
                onJumpToPage={goToPage}
              />
            </aside>
          </>
        )}
      </div>

      <NoteEditor
        open={noteEditorOpen}
        pageNumber={editingNote?.pageNumber ?? currentPage}
        initialContent={editingNote?.content ?? ""}
        noteId={editingNote?.id ?? null}
        onClose={() => {
          setNoteEditorOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        onDelete={
          editingNote
            ? async () => handleDeleteNote(editingNote.id)
            : undefined
        }
      />
    </div>
  );
}
