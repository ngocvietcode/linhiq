"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Session {
  id: string;
  title: string | null;
  subject: { name: string; iconEmoji: string; curriculum: string };
  messages: Message[];
}

function ChatContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Load session
  useEffect(() => {
    if (!token || !id) return;
    api<Session>(`/chat/sessions/${id}`, { token })
      .then((s) => {
        setSession(s);
        setMessages(s.messages);
      })
      .catch(() => router.push("/dashboard"));
  }, [token, id, router]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingText]);

  // Send message with SSE streaming
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming || !token) return;

    const userMsg = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    // Optimistic: add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMsg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500/api"}/chat/sessions/${id}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: userMsg, hintLevel }),
        }
      );

      if (!res.ok) throw new Error("Failed to send message");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === "text") {
            fullText += data.content;
            setStreamingText(fullText);
          } else if (data.type === "done") {
            // Add completed AI message
            const aiMsg: Message = {
              id: `ai-${Date.now()}`,
              role: "assistant",
              content: fullText,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setStreamingText("");
          }
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      setStreamingText("");
      // Show error message
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "⚠️ Sorry, I encountered an error. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, token, id, hintLevel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            ← Back
          </button>
          <div className="h-5 w-px bg-border" />
          <span className="text-lg">{session.subject?.iconEmoji || "💬"}</span>
          <div>
            <h1 className="text-sm font-medium">
              {session.title || session.subject?.name || "Open Chat"}
            </h1>
            <p className="text-xs text-text-muted">
              {session.subject?.curriculum || "LinhIQ AI"}
            </p>
          </div>
        </div>

        {/* Hint Level Selector — only shown in Subject mode */}
        {session.subject && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-muted mr-1">Hint:</span>
          {([
            { level: 1 as const, label: 'L1', tip: 'Khơi gợi' },
            { level: 2 as const, label: 'L2', tip: 'Cấu trúc' },
            { level: 3 as const, label: 'L3', tip: 'Key Terms' },
            { level: 4 as const, label: 'L4', tip: 'Ví dụ' },
            { level: 5 as const, label: 'L5', tip: 'Đáp án' },
          ]).map(({ level, label, tip }) => (
            <button
              key={level}
              onClick={() => setHintLevel(level)}
              title={tip}
              className={`px-2 py-0.5 text-xs rounded-full transition-all
                ${hintLevel === level
                  ? "bg-accent text-white"
                  : "bg-bg-card text-text-muted hover:text-text-secondary"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !streamingText && (
          <div className="text-center py-16">
            <span className="text-4xl">{session.subject?.iconEmoji || "💬"}</span>
            <h2 className="text-xl font-medium mt-4">
              {session.subject?.name || "Open Chat"} — {session.subject?.curriculum || "LinhIQ AI"}
            </h2>
            <p className="text-text-secondary mt-2 max-w-md mx-auto">
              Ask me anything! I&apos;ll guide you with Socratic questions
              instead of giving direct answers.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {[
                "What is osmosis?",
                "Explain photosynthesis",
                "Compare mitosis and meiosis",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-sm bg-bg-card border border-border px-3 py-1.5 rounded-full
                             text-text-secondary hover:text-text-primary hover:border-accent
                             transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed
                ${msg.role === "user"
                  ? "bg-accent text-white rounded-br-md"
                  : "bg-bg-card border border-border text-text-primary rounded-bl-md"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5 -mb-0.5 rounded-sm" />
            </div>
          </div>
        )}

        {isStreaming && !streamingText && (
          <div className="flex justify-start">
            <div className="bg-bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your question..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 px-4 py-3 bg-bg-card border border-border rounded-xl
                       text-text-primary placeholder:text-text-muted resize-none
                       focus:border-accent focus:ring-1 focus:ring-accent
                       disabled:opacity-50 transition-colors
                       min-h-[48px] max-h-[120px]"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       active:scale-95 flex-shrink-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthProvider>
      <ChatContent />
    </AuthProvider>
  );
}
