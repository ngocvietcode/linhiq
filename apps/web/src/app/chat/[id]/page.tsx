"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Camera, Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  hintLevel?: number;
  createdAt: string;
}

interface Session {
  id: string;
  title: string | null;
  mode: 'SUBJECT' | 'OPEN';
  subject: { name: string; iconEmoji: string; curriculum: string } | null;
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
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3>(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!token || !id) return;
    api<Session>(`/chat/sessions/${id}`, { token })
      .then((s) => {
        setSession(s);
        setMessages(s.messages);
      })
      .catch(() => router.push("/dashboard"));
  }, [token, id, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingText]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming || !token) return;

    const userMsg = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

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
          body: JSON.stringify({ content: userMsg, hintLevel: session?.mode === 'SUBJECT' ? hintLevel : undefined }),
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
            const aiMsg: Message = {
              id: `ai-${Date.now()}`,
              role: "assistant",
              content: fullText,
              hintLevel: session?.mode === 'SUBJECT' ? hintLevel : undefined,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setStreamingText("");
          }
        }
      }
    } catch (err) {
      console.error(err);
      setStreamingText("");
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
  }, [input, isStreaming, token, id, hintLevel, session]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-void">
        <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const isOpenMode = session.mode === 'OPEN';
  const headerTitle = isOpenMode ? "Chat với Linh" : `${session.subject?.name} · ${session.subject?.curriculum}`;
  const headerEmoji = isOpenMode ? "💬" : session.subject?.iconEmoji;

  const getHintLabel = (level: number) => {
    if (level === 1) return "Hint Level 1 — Nudge";
    if (level === 2) return "Hint Level 2 — Structure";
    return "Hint Level 3 — Key Terms";
  };

  return (
    <div className="flex flex-col h-screen bg-bg-void max-w-4xl mx-auto md:border-x md:border-border-subtle relative shadow-2xl">
      {/* HEADER */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-void/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/dashboard")}
            className="text-text-secondary hover:text-text-primary p-2 -ml-2 rounded-lg hover:bg-bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{headerEmoji}</span>
            <span className="font-semibold text-[15px]">{headerTitle}</span>
          </div>
        </div>

        {/* HINT CHIPS */}
        {!isOpenMode && (
          <div className="flex items-center gap-1.5 bg-bg-surface p-1 rounded-full border border-border-subtle">
            <span className="text-xs text-text-muted px-2 font-medium">Hint:</span>
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setHintLevel(lvl as any)}
                className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                  hintLevel === lvl 
                    ? "bg-accent text-white shadow-glow" 
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* MESSAGES AREA */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-4 py-8 space-y-6 bg-bg-base/30"
      >
        {messages.length === 0 && !streamingText && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-80 pb-20">
            <div className="text-5xl mb-4">{headerEmoji}</div>
            <h2 className="text-xl font-medium mb-2">{isOpenMode ? "Ready to chat." : `Ready to study ${session.subject?.name}.`}</h2>
            <p className="text-text-secondary max-w-sm mb-8 text-[15px]">
              {isOpenMode 
                ? "Talk about anything — school, life, or just say hi!" 
                : "Ask me anything! I'll guide you with Socratic questions."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {(isOpenMode 
                ? ["Hôm nay mệt quá 😔", "Tell me a joke!", "Let's talk about games 🎮"] 
                : ["What is osmosis?", "Explain respiration", "Compare mitosis and meiosis"]
              ).map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-4 py-2 rounded-xl border border-border-subtle bg-bg-surface text-sm text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MESSAGE BUBBLES */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`flex flex-col relative max-w-[85%] md:max-w-[70%] ${
                  isUser 
                    ? 'bg-accent text-white rounded-[18px_18px_4px_18px] px-5 py-3 shadow-md'
                    : 'bg-bg-surface border border-border-subtle rounded-[4px_18px_18px_18px] px-5 py-4 shadow-sm'
                }`}
              >
                {!isUser && msg.hintLevel && (
                  <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-semibold text-accent/90 uppercase tracking-widest bg-accent/10 w-fit px-2.5 py-1 rounded-md">
                    💡 {getHintLabel(msg.hintLevel)}
                  </div>
                )}
                <div className={`text-[15px] leading-relaxed ${isUser ? 'whitespace-pre-wrap' : 'prose prose-invert prose-p:leading-relaxed prose-pre:bg-bg-elevated max-w-none'}`}>
                  {isUser ? msg.content : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
                {!isUser && (
                  <div className="absolute -left-12 bottom-0 text-[11px] text-text-muted font-medium">LinhIQ</div>
                )}
              </div>
            </div>
          );
        })}

        {/* STREAMING BUBBLE */}
        {streamingText && (
          <div className="flex w-full justify-start">
            <div className="flex flex-col bg-bg-surface border border-border-subtle rounded-[4px_18px_18px_18px] px-5 py-4 max-w-[85%] md:max-w-[70%] shadow-glow">
              {!isOpenMode && (
                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-accent/90 uppercase tracking-widest bg-accent/10 w-fit px-2.5 py-1 rounded-md">
                  💡 {getHintLabel(hintLevel)}
                </div>
              )}
              <div className="text-[15px] leading-relaxed prose prose-invert prose-p:leading-relaxed prose-pre:bg-bg-elevated max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingText}
                </ReactMarkdown>
                <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-1 -mb-0.5 rounded-sm" />
              </div>
            </div>
          </div>
        )}

        {isStreaming && !streamingText && (
          <div className="flex w-full justify-start">
            <div className="bg-bg-surface border border-border-subtle rounded-[4px_18px_18px_18px] px-5 py-4 flex gap-1.5 items-center max-w-fit shadow-sm">
              <div className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-accent/80 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-bg-void/90 backdrop-blur-md border-t border-border-subtle shrink-0">
        <div className="relative flex items-end gap-2 bg-bg-surface border border-border-subtle rounded-2xl p-2 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all shadow-sm">
          <button className="p-2 text-text-muted hover:text-text-primary transition-colors shrink-0 rounded-xl hover:bg-bg-elevated">
            <Camera className="w-5 h-5" />
          </button>
          
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something... (Enter to send, Shift+Enter for new line)"
            className="flex-1 max-h-[120px] bg-transparent resize-none outline-none py-2.5 text-[15px] text-text-primary min-h-[44px] placeholder:text-text-muted"
            rows={1}
            disabled={isStreaming}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="p-2.5 bg-accent text-white rounded-xl hover:bg-[#7b7ef5] transition-all disabled:opacity-40 shrink-0"
          >
            <Send className="w-5 h-5 -ml-0.5" />
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
