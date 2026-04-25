"use client";

import { useEffect, useRef } from "react";
import { Send, Sparkles, X, FileText } from "lucide-react";
import { CitationMarkdown } from "./CitationMarkdown";
import { QuickActionChips } from "./QuickActionChips";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { documentTitle: string; chunkId: string }[];
}

interface Props {
  pageNumber: number;
  topicName: string | null;
  chapterName: string | null;
  bookShortTitle: string | null;
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSend: (overrideContent?: string) => void;
  onClose?: () => void;
  onJumpToPage: (page: number) => void;
}

export function AiPanel({
  pageNumber,
  topicName,
  chapterName,
  bookShortTitle,
  messages,
  streamingText,
  isStreaming,
  input,
  onInputChange,
  onSend,
  onClose,
  onJumpToPage,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingText]);

  const suggestions = buildSuggestions({ pageNumber, topicName, chapterName });
  const showEmpty = messages.length === 0 && !streamingText && !isStreaming;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--color-surface-1)" }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--color-accent-soft)" }}
        >
          <Sparkles size={14} style={{ color: "var(--color-accent)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight">Linh AI</div>
          <div
            className="text-[11px] truncate leading-tight"
            style={{ color: "var(--color-text-muted)" }}
          >
            {bookShortTitle && `${bookShortTitle} · `}p.{pageNumber}
            {topicName && ` · ${topicName}`}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="Đóng panel"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-4"
      >
        {showEmpty && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--color-accent-soft)" }}
              >
                <Sparkles size={20} style={{ color: "var(--color-accent)" }} />
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Hỏi Linh về trang này hoặc chọn một gợi ý bên dưới.
              </p>
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <div
                  className="text-[10px] uppercase tracking-wider px-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Gợi ý cho trang này
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onInputChange(s)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: "var(--color-surface-0)",
                      border: "1px solid var(--color-border-subtle)",
                      color: "var(--color-text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "var(--color-accent-soft)";
                      el.style.color = "var(--color-accent)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "var(--color-surface-0)";
                      el.style.color = "var(--color-text-secondary)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[92%] text-[13px] leading-relaxed ${
                msg.role === "assistant" ? "prose-chat" : ""
              }`}
              style={
                msg.role === "user"
                  ? {
                      background: "var(--color-surface-2)",
                      borderRadius: "14px 14px 3px 14px",
                      padding: "8px 12px",
                      border: "1px solid var(--color-border-default)",
                    }
                  : { padding: "2px 0", width: "100%" }
              }
            >
              {msg.role === "assistant" ? (
                <>
                  <CitationMarkdown
                    content={msg.content}
                    onJumpToPage={onJumpToPage}
                  />
                  {msg.sources && msg.sources.length > 0 && (
                    <SourceChips sources={msg.sources} />
                  )}
                </>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="flex justify-start">
            <div
              className="max-w-[92%] text-[13px] leading-relaxed prose-chat"
              style={{ padding: "2px 0", width: "100%" }}
            >
              <CitationMarkdown
                content={streamingText}
                onJumpToPage={onJumpToPage}
              />
              <span
                className="inline-block w-1 h-3.5 ml-0.5 -mb-0.5 rounded-sm animate-pulse"
                style={{ background: "var(--color-accent)" }}
              />
            </div>
          </div>
        )}

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

      {/* Quick actions */}
      <div
        className="flex-shrink-0 px-3 pt-2 pb-2 border-t"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <QuickActionChips
          pageNumber={pageNumber}
          topicName={topicName}
          chapterName={chapterName}
          disabled={isStreaming}
          onTrigger={(prompt) => onSend(prompt)}
        />
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 px-3 pb-3 pt-1"
      >
        <div
          className="flex items-end gap-2 rounded-xl border px-3 py-2"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border-default)",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
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
            onClick={() => onSend()}
            disabled={!input.trim() || isStreaming}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30 flex-shrink-0"
            style={{ color: "var(--color-accent)" }}
            aria-label="Gửi"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SourceChips({
  sources,
}: {
  sources: { documentTitle: string; chunkId: string }[];
}) {
  // Dedupe by documentTitle
  const seen = new Set<string>();
  const unique = sources.filter((s) => {
    if (seen.has(s.documentTitle)) return false;
    seen.add(s.documentTitle);
    return true;
  });
  if (unique.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <span
        className="text-[10px] uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        Nguồn:
      </span>
      {unique.slice(0, 4).map((s, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
          style={{
            background: "var(--color-surface-0)",
            border: "1px solid var(--color-border-subtle)",
            color: "var(--color-text-muted)",
          }}
          title={s.documentTitle}
        >
          <FileText size={9} />
          <span className="max-w-[120px] truncate">{s.documentTitle}</span>
        </span>
      ))}
    </div>
  );
}

function buildSuggestions({
  pageNumber,
  topicName,
  chapterName,
}: {
  pageNumber: number;
  topicName: string | null;
  chapterName: string | null;
}): string[] {
  const focus = topicName ?? chapterName;
  if (focus) {
    return [
      `Ý chính của ${focus} là gì?`,
      `Cho ví dụ minh hoạ ${focus}.`,
      `${focus} thường xuất hiện trong dạng câu hỏi nào?`,
    ];
  }
  return [
    `Trang ${pageNumber} đang nói về điều gì?`,
    `Ý nào ở trang này quan trọng nhất cho kỳ thi?`,
    `Có khái niệm nào dễ nhầm lẫn ở trang này không?`,
  ];
}
