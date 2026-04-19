"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MessageSquare,
  ArrowLeft,
  List,
  X,
  Send,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface BookVolume {
  id: string;
  title: string;
  shortTitle: string;
  bookType: string;
  isDefault: boolean;
  totalPages: number | null;
  coverColor: string | null;
  subjectId: string;
}

interface PageContext {
  pageNumber: number;
  topicId: string | null;
  topicName: string | null;
  chapterName: string | null;
  bookVolumeId: string;
}

interface TocEntry {
  chapterName: string;
  topicName: string | null;
  topicId: string | null;
  startPage: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ─── Book type icons ─────────────────────────────────────────────────────────

const BOOK_ICONS: Record<string, string> = {
  COURSEBOOK: "📗",
  WORKBOOK: "📘",
  REVISION_GUIDE: "📙",
  PAST_PAPER: "📝",
  SYLLABUS: "📋",
  TEACHER_GUIDE: "👩‍🏫",
};

// ─── Reader Page ─────────────────────────────────────────────────────────────

export default function ReaderPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  // Book volumes
  const [books, setBooks] = useState<BookVolume[]>([]);
  const [activeBook, setActiveBook] = useState<BookVolume | null>(null);

  // Viewer state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [pageInput, setPageInput] = useState("1");
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // ToC sidebar
  const [tocOpen, setTocOpen] = useState(false);
  const [toc, setToc] = useState<TocEntry[]>([]);

  // Chat panel
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // ── Load book volumes ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !subjectId) return;
    api<BookVolume[]>(`/textbooks?subjectId=${subjectId}`, { token })
      .then((data) => {
        setBooks(data);
        const defaultBook = data.find((b) => b.isDefault) ?? data[0];
        if (defaultBook) setActiveBook(defaultBook);
      })
      .catch(() => setBooks([]));
  }, [token, subjectId]);

  // ── Load ToC when book changes ───────────────────────────────────────────
  useEffect(() => {
    if (!token || !activeBook) return;
    setCurrentPage(1);
    setPageInput("1");
    api<TocEntry[]>(`/textbooks/${activeBook.id}/toc`, { token })
      .then(setToc)
      .catch(() => setToc([]));
  }, [token, activeBook]);

  // ── Load page image & context ────────────────────────────────────────────
  useEffect(() => {
    if (!token || !activeBook) return;

    setImgLoading(true);
    setImgError(false);

    // Build authenticated image URL via fetch + object URL to avoid cookie/token issues
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

    // Load page context
    api<PageContext>(
      `/textbooks/${activeBook.id}/pages/${currentPage}/context`,
      { token }
    )
      .then(setPageContext)
      .catch(() => setPageContext(null));

    return () => {
      controller.abort();
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeBook, currentPage]);

  // ── Create chat session for this subject ────────────────────────────────
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

  // ── Auto-scroll chat ─────────────────────────────────────────────────────
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, streamingText]);

  // ── Navigation helpers ───────────────────────────────────────────────────
  const totalPages = activeBook?.totalPages ?? null;

  const goToPage = useCallback(
    (page: number) => {
      if (!totalPages) return;
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
      setPageInput(String(clamped));
    },
    [totalPages]
  );

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") goToPage(currentPage + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") goToPage(currentPage - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPage, goToPage]);

  // ── Send chat message ────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() || isStreaming || !token || !chatSessionId) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setIsStreaming(true);
    setStreamingText("");

    setChatMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: userMsg },
    ]);

    try {
      const res = await fetch(`${API_URL}/chat/sessions/${chatSessionId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: userMsg,
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
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

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
              setChatMessages((prev) => [
                ...prev,
                { id: `a-${Date.now()}`, role: "assistant", content: fullText },
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
          content: "⚠️ Error — please try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [chatInput, isStreaming, token, chatSessionId, pageContext]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (authLoading || books.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-base)" }}
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--color-base)" }}
    >
      {/* ── Top Header ── */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b"
        style={{
          background: "rgba(23,23,23,0.95)",
          backdropFilter: "blur(16px)",
          borderColor: "var(--color-border-subtle)",
          minHeight: "52px",
        }}
      >
        {/* Back button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={{ color: "var(--color-text-muted)" }}
          title="Back to Dashboard"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Book selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0">
          {books.map((book) => {
            const isActive = activeBook?.id === book.id;
            const icon = BOOK_ICONS[book.bookType] ?? "📚";
            return (
              <button
                key={book.id}
                onClick={() => setActiveBook(book)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  background: isActive
                    ? book.coverColor ?? "var(--color-accent)"
                    : "var(--color-surface)",
                  color: isActive ? "#fff" : "var(--color-text-secondary)",
                  border: isActive
                    ? `1px solid ${book.coverColor ?? "var(--color-accent)"}`
                    : "1px solid var(--color-border-subtle)",
                }}
              >
                <span>{icon}</span>
                <span>{book.shortTitle}</span>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.8)" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Page context breadcrumb */}
        {pageContext?.chapterName && (
          <div
            className="hidden md:flex items-center gap-2 text-xs flex-shrink-0 max-w-xs truncate"
            style={{ color: "var(--color-text-muted)" }}
          >
            <BookOpen size={13} />
            <span className="truncate">
              {pageContext.chapterName}
              {pageContext.topicName && (
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {" "}
                  › {pageContext.topicName}
                </span>
              )}
            </span>
          </div>
        )}

        {/* ToC toggle */}
        <button
          onClick={() => setTocOpen((o) => !o)}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
          style={{
            color: tocOpen ? "var(--color-accent)" : "var(--color-text-muted)",
            background: tocOpen ? "var(--color-accent-soft)" : "transparent",
          }}
          title="Table of Contents"
        >
          <List size={18} />
        </button>
      </header>

      {/* ── Main body ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── ToC Sidebar ── */}
        {tocOpen && (
          <aside
            className="w-72 flex-shrink-0 border-r overflow-y-auto"
            style={{
              background: "var(--color-void)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b sticky top-0"
              style={{
                background: "var(--color-void)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <span className="text-sm font-semibold">Table of Contents</span>
              <button
                onClick={() => setTocOpen(false)}
                className="p-1 rounded"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="py-2">
              {toc.length === 0 ? (
                <p
                  className="text-xs px-4 py-6 text-center"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No table of contents available
                </p>
              ) : (
                toc.map((entry, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      goToPage(entry.startPage);
                      setTocOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                    style={{
                      color:
                        pageContext?.topicId === entry.topicId && entry.topicId
                          ? "var(--color-accent)"
                          : "var(--color-text-secondary)",
                      borderLeft:
                        pageContext?.topicId === entry.topicId && entry.topicId
                          ? "2px solid var(--color-accent)"
                          : "2px solid transparent",
                    }}
                  >
                    <div className="font-medium">{entry.chapterName}</div>
                    {entry.topicName && (
                      <div
                        className="text-[11px] mt-0.5"
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
                ))
              )}
            </div>
          </aside>
        )}

        {/* ── PDF Viewer (70%) ── */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ flex: "0 0 65%", minWidth: 0 }}
        >
          {/* Page image */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden p-4"
            style={{ background: "var(--color-base)" }}
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
                <p className="text-sm">Page image not available</p>
                <p className="text-xs mt-1 opacity-60">
                  Run the register-book script to process this book
                </p>
              </div>
            )}
            {imgSrc && !imgLoading && !imgError && (
              // DRM: no drag, no right-click, no user-select
              <img
                src={imgSrc}
                alt={`Page ${currentPage}`}
                className="max-w-full max-h-full object-contain rounded shadow-lg select-none"
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                }}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </div>

          {/* Page navigation bar */}
          <div
            className="flex-shrink-0 flex items-center justify-center gap-4 px-4 py-3 border-t"
            style={{
              background: "rgba(23,23,23,0.9)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg transition-colors disabled:opacity-30"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
              }}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Page input */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => {
                  const n = parseInt(pageInput);
                  if (!isNaN(n)) goToPage(n);
                  else setPageInput(String(currentPage));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const n = parseInt(pageInput);
                    if (!isNaN(n)) goToPage(n);
                  }
                }}
                className="w-14 text-center text-sm font-medium rounded-lg px-2 py-1.5 border outline-none"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border-default)",
                  color: "var(--color-text-primary)",
                }}
                min={1}
                max={totalPages ?? 9999}
              />
              {totalPages && (
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  / {totalPages}
                </span>
              )}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={totalPages !== null && currentPage >= totalPages}
              className="p-2 rounded-lg transition-colors disabled:opacity-30"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* ── Chat Panel (30%) ── */}
        <div
          className="flex flex-col border-l"
          style={{
            flex: "0 0 35%",
            minWidth: 0,
            background: "var(--color-void)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          {/* Chat header */}
          <div
            className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <MessageSquare size={15} style={{ color: "var(--color-accent)" }} />
            <span className="text-sm font-semibold">Chat với Linh</span>
            {pageContext?.topicName && (
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--color-accent-soft)",
                  color: "var(--color-accent)",
                }}
              >
                {pageContext.topicName}
              </span>
            )}
          </div>

          {/* Context indicator */}
          {pageContext?.chapterName && (
            <div
              className="flex-shrink-0 px-4 py-2 text-xs border-b"
              style={{
                background: "rgba(218,119,86,0.06)",
                borderColor: "var(--color-border-subtle)",
                color: "var(--color-text-muted)",
              }}
            >
              📖 {activeBook?.shortTitle} — p.{currentPage}
              {pageContext.chapterName && ` · ${pageContext.chapterName}`}
            </div>
          )}

          {/* Messages */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-3 py-4 space-y-4"
          >
            {chatMessages.length === 0 && !streamingText && (
              <div
                className="text-center py-10"
                style={{ color: "var(--color-text-muted)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mx-auto mb-3"
                  style={{ background: "var(--color-accent-soft)" }}
                >
                  📚
                </div>
                <p className="text-xs">
                  Hỏi Linh về trang này — AI sẽ dùng ngữ cảnh từ
                  <br />
                  tất cả sách trong môn học này.
                </p>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] text-[13px] leading-relaxed ${
                    msg.role === "assistant" ? "prose-chat" : ""
                  }`}
                  style={
                    msg.role === "user"
                      ? {
                          background: "var(--color-elevated)",
                          borderRadius: "14px 14px 3px 14px",
                          padding: "8px 12px",
                          border: "1px solid var(--color-border-default)",
                        }
                      : { padding: "2px 0" }
                  }
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* Streaming */}
            {streamingText && (
              <div className="flex justify-start">
                <div
                  className="max-w-[90%] text-[13px] leading-relaxed prose-chat"
                  style={{ padding: "2px 0" }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingText}
                  </ReactMarkdown>
                  <span
                    className="inline-block w-1 h-3.5 ml-0.5 -mb-0.5 rounded-sm animate-pulse"
                    style={{ background: "var(--color-accent)" }}
                  />
                </div>
              </div>
            )}

            {/* Thinking dots */}
            {isStreaming && !streamingText && (
              <div className="flex justify-start">
                <div className="flex gap-1.5 items-center py-2">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full animate-bounce-dot"
                      style={{
                        background: "var(--color-accent)",
                        animationDelay: `${delay}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div
            className="flex-shrink-0 px-3 py-3 border-t"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <div
              className="flex items-end gap-2 rounded-xl border px-3 py-2"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border-default)",
              }}
            >
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Hỏi về trang này..."
                disabled={isStreaming}
                rows={1}
                className="flex-1 bg-transparent text-xs resize-none outline-none"
                style={{
                  color: "var(--color-text-primary)",
                  minHeight: "20px",
                  maxHeight: "96px",
                  lineHeight: "1.6",
                }}
                onInput={(e) => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || isStreaming}
                className="p-1.5 rounded-lg transition-all disabled:opacity-30 flex-shrink-0"
                style={{ color: "var(--color-accent)" }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
