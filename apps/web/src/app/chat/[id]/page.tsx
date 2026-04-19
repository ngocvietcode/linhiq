"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Send,
  Camera,
  Home,
  MessageSquare,
  TrendingUp,
  Settings,
  Map,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  MilestoneRoadmapSidebar,
  MilestoneRoadmapContent,
  type MilestoneData,
  type TopicMastery,
} from "@/components/chat/MilestoneRoadmapSidebar";
import { QuizModal } from "@/components/chat/QuizModal";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Session {
  id: string;
  title: string | null;
  mode: "SUBJECT" | "OPEN";
  subject: {
    id: string;
    name: string;
    iconEmoji: string;
    curriculum: string;
  } | null;
  messages: Message[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const HINT_LEVELS = [
  { level: 1 as const, label: "L1", desc: "Nudge — a gentle push in the right direction" },
  { level: 2 as const, label: "L2", desc: "Structure — a framework to scaffold your thinking" },
  { level: 3 as const, label: "L3", desc: "Key Terms — vocabulary to build your answer" },
  { level: 4 as const, label: "L4", desc: "Example — a similar worked example" },
  { level: 5 as const, label: "L5", desc: "Near Answer — almost the full answer" },
];

const SUBJECT_SUGGESTIONS: Record<string, string[]> = {
  Biology: [
    "What is osmosis?",
    "Explain photosynthesis",
    "Compare mitosis and meiosis",
    "How does the heart pump blood?",
  ],
  Chemistry: [
    "What is ionic bonding?",
    "Explain electrolysis",
    "What makes acids different from bases?",
    "How do catalysts work?",
  ],
  Mathematics: [
    "How do I solve quadratic equations?",
    "Explain differentiation",
    "What is the binomial theorem?",
  ],
};

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageSquare, label: "Chat với Linh" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

// ─── Chat Content ─────────────────────────────────────────────────────────────

function ChatContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading: authLoading } = useAuth();

  // Session & messages
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showHintInfo, setShowHintInfo] = useState(false);

  // Vision AI state
  const [imagePreview, setImagePreview] = useState<string | null>(null); // data URL for preview
  const [imageBase64, setImageBase64] = useState<string | null>(null);   // raw base64 (no prefix)
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Roadmap sidebar state
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [roadmapOpen, setRoadmapOpen] = useState(true);
  const [mobileRoadmapOpen, setMobileRoadmapOpen] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [recentlyUpdatedTopicId, setRecentlyUpdatedTopicId] = useState<string | null>(null);

  // Quiz modal state
  const [quizState, setQuizState] = useState<{
    open: boolean;
    type: "topic" | "milestone";
    targetId: string;
    targetName: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // ── Load session ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !id) return;
    api<Session>(`/chat/sessions/${id}`, { token })
      .then((s) => {
        setSession(s);
        setMessages(s.messages);
      })
      .catch(() => router.push("/dashboard"));
  }, [token, id, router]);

  // ── Load roadmap mastery when session is a SUBJECT mode ───────────────────
  useEffect(() => {
    if (!token || !session?.subject?.id || session.mode !== "SUBJECT") return;

    api<{ success: boolean; data: MilestoneData[] }>(
      `/subjects/${session.subject.id}/roadmap-mastery`,
      { token }
    )
      .then((res) => setMilestones(res.data ?? []))
      .catch(() => setMilestones([]));
  }, [token, session?.subject?.id, session?.mode]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingText]);

  // ── Image helpers ──────────────────────────────────────────────────────────
  const loadImageFile = (file: File) => {
    const mime = file.type || "image/jpeg";
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Strip the "data:<mime>;base64," prefix
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      setImageMimeType(mime);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType("image/jpeg");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Paste image from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) loadImageFile(file);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !imageBase64) || isStreaming || !token) return;
    const userMsg = input.trim();
    const imgBase64 = imageBase64;
    const imgMime = imageMimeType;
    const imgPreview = imagePreview;
    setInput("");
    clearImage();
    setIsStreaming(true);
    setStreamingText("");

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: imgPreview
        ? `${userMsg}${userMsg ? "\n" : ""}![uploaded image](${imgPreview})`
        : userMsg,
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
          body: JSON.stringify({ content: userMsg, hintLevel, imageBase64: imgBase64, imageMimeType: imgMime }),
        }
      );

      if (!res.ok || !res.body) {
        const errText = await res.text();
        console.error("STREAM ERROR:", res.status, errText);
        throw new Error(`Stream failed: ${res.status} ${errText}`);
      }
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
              setMessages((prev) => [
                ...prev,
                {
                  id: `ai-${Date.now()}`,
                  role: "assistant",
                  content: fullText,
                  createdAt: new Date().toISOString(),
                },
              ]);
              setStreamingText("");

              // ── Optimistic mastery update from SSE done payload ──
              const mu = data.masteryUpdate as {
                topicId: string;
                masteryLevel: number;
              } | undefined;

              if (mu?.topicId) {
                setActiveTopicId(mu.topicId);
                setRecentlyUpdatedTopicId(mu.topicId);

                // Update the milestones state locally without refetch
                setMilestones((prev) =>
                  prev.map((milestone) => ({
                    ...milestone,
                    topics: milestone.topics.map((topic) => {
                      if (topic.id !== mu.topicId) return topic;

                      const newMastery = mu.masteryLevel;
                      const newTier =
                        newMastery >= 0.8
                          ? ("excellent" as const)
                          : newMastery >= 0.5
                            ? ("good" as const)
                            : newMastery > 0
                              ? ("average" as const)
                              : ("not_started" as const);

                      return {
                        ...topic,
                        masteryLevel: newMastery,
                        masteryTier: newTier,
                        questionsAsked: topic.questionsAsked + 1,
                        correctAnswers:
                          hintLevel <= 2
                            ? topic.correctAnswers + 1
                            : topic.correctAnswers,
                      };
                    }),
                    // Recalculate milestone aggregate
                    get completedTopics() {
                      return this.topics.filter((t) => t.masteryLevel >= 0.5)
                        .length;
                    },
                    get milestoneMastery() {
                      return this.topics.length > 0
                        ? this.topics.reduce(
                            (s, t) => s + t.masteryLevel,
                            0
                          ) / this.topics.length
                        : 0;
                    },
                  }))
                );

                // Clear pulse after 4s
                setTimeout(() => setRecentlyUpdatedTopicId(null), 4000);
              }
            }
          } catch {
            /* skip malformed lines */
          }
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      setStreamingText("");
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "⚠️ Error — please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, imageBase64, imageMimeType, imagePreview, isStreaming, token, id, hintLevel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  function autoResize(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.target as HTMLTextAreaElement;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 144) + "px";
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (authLoading || !session) {
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

  const isOpen = session.mode === "OPEN";
  const isSubject = session.mode === "SUBJECT";
  const chatEmoji = isOpen ? "💬" : session.subject?.iconEmoji || "📚";
  const chatTitle = isOpen
    ? "Chat với Linh"
    : session.title || session.subject?.name || "Study";
  const chatSubtitle = isOpen
    ? "Open Chat"
    : `${session.subject?.curriculum || "International"} · ${session.subject?.name}`;

  const suggestions = session.subject
    ? SUBJECT_SUGGESTIONS[session.subject.name] || ["What would you like to learn?"]
    : [
        "Mai thi rồi mà chưa học gì 🥲",
        "Làm sao biết mình hợp ngành nào? 🤔",
        "Kể chuyện gì vô tri đi Linh 🐧",
        "Cho mình xin tí động lực học với ✨",
      ];

  const currentHintInfo = HINT_LEVELS.find((h) => h.level === hintLevel)!;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100svh-64px)] md:h-screen flex" style={{ background: "var(--color-base)" }}>
      {/* ── Left Nav Sidebar (desktop) ── */}
      <aside
        className="hidden md:flex flex-col w-56 border-r flex-shrink-0"
        style={{
          background: "var(--color-void)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        <div
          className="px-5 py-6 border-b"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <span className="text-xl font-bold">
            <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith("/chat");
            const isChat = href === "/chat";
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background:
                    active && isChat ? "var(--color-accent-soft)" : "transparent",
                  color:
                    active && isChat
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Chat Column ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* ── Header ── */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b"
          style={{
            background: "rgba(23,23,23,0.92)",
            backdropFilter: "blur(16px)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "var(--color-text-primary)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "var(--color-text-muted)")
              }
            >
              <ArrowLeft size={18} />
            </button>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: "var(--color-accent-soft)" }}
            >
              {chatEmoji}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">{chatTitle}</h1>
              <p
                className="text-xs truncate"
                style={{ color: "var(--color-text-muted)" }}
              >
                {chatSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Hint level selector */}
            {!isOpen && (
              <div className="flex items-center gap-1.5 relative">
                <span
                  className="text-xs mr-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Hint:
                </span>
                {HINT_LEVELS.map(({ level, label }) => (
                  <button
                    key={level}
                    onClick={() => {
                      setHintLevel(level);
                      setShowHintInfo(true);
                      setTimeout(() => setShowHintInfo(false), 2000);
                    }}
                    title={HINT_LEVELS[level - 1].desc}
                    className="w-8 h-7 flex items-center justify-center text-xs font-bold rounded-md transition-all duration-150"
                    style={{
                      background:
                        hintLevel === level
                          ? "var(--color-accent)"
                          : "var(--color-surface)",
                      color:
                        hintLevel === level ? "#fff" : "var(--color-text-muted)",
                      border:
                        hintLevel === level
                          ? "1px solid var(--color-accent)"
                          : "1px solid var(--color-border-subtle)",
                      transform: hintLevel === level ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    {label}
                  </button>
                ))}
                {showHintInfo && (
                  <div
                    className="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap z-50 animate-fade-up"
                    style={{
                      background: "var(--color-elevated)",
                      border: "1px solid var(--color-border-default)",
                      color: "var(--color-text-secondary)",
                      boxShadow: "var(--shadow-md)",
                    }}
                  >
                    💡 <strong>{currentHintInfo.label}</strong> —{" "}
                    {currentHintInfo.desc}
                  </div>
                )}
              </div>
            )}

            {/* Mobile roadmap toggle */}
            {isSubject && (
              <button
                onClick={() => setMobileRoadmapOpen(true)}
                className="md:hidden p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--color-text-muted)" }}
                title="Show Roadmap"
              >
                <Map size={18} />
              </button>
            )}
          </div>
        </header>

        {/* ── Messages ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-5 pb-4">
            {/* Empty state */}
            {messages.length === 0 && !streamingText && (
              <div className="text-center py-16 animate-fade-up">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
                  style={{ background: "var(--color-accent-soft)" }}
                >
                  {chatEmoji}
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  {isOpen
                    ? "Chat với Linh"
                    : `Ready to study ${session.subject?.name}.`}
                </h2>
                <p
                  className="text-sm mb-8"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {isOpen
                    ? "Hey! Mình là Linh — Cứ thoải mái tâm sự với mình nhé! Dù là gỡ rối bài vở, băn khoăn về định hướng tương lai hay chỉ đơn giản là tán nhảm vô tri 😆"
                    : "Ask me anything! I'll guide you with Socratic questions instead of giving direct answers."}
                </p>
                {!isOpen && (
                  <div className="inline-block hint-badge mb-6">
                    Using hint {currentHintInfo.label} — {currentHintInfo.desc}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        inputRef.current?.focus();
                      }}
                      className="text-sm px-4 py-2 rounded-full border transition-all duration-150"
                      style={{
                        background: "var(--color-surface)",
                        borderColor: "var(--color-border-default)",
                        color: "var(--color-text-secondary)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "var(--color-accent)";
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--color-text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "var(--color-border-default)";
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--color-text-secondary)";
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages list */}
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-fade-up`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                    style={{ background: "var(--color-accent-soft)" }}
                  >
                    {isOpen ? "😊" : chatEmoji}
                  </div>
                )}
                <div
                  className={`max-w-[80%] sm:max-w-[72%] text-[15px] leading-relaxed ${
                    msg.role === "assistant"
                      ? "prose-chat max-w-none"
                      : ""
                  }`}
                  style={
                    msg.role === "user"
                      ? {
                          background: "var(--color-elevated)",
                          color: "var(--color-text-primary)",
                          borderRadius: "18px 18px 4px 18px",
                          padding: "11px 16px",
                          whiteSpace: "pre-wrap",
                          border: "1px solid var(--color-border-default)",
                        }
                      : {
                          color: "var(--color-text-primary)",
                          padding: "2px 0",
                        }
                  }
                >
                  {msg.role === "user" ? (
                    msg.content.includes("![uploaded image](") ? (
                      <div className="flex flex-col gap-3">
                        {msg.content.split(/\!\[uploaded image\]\((data:image\/[^;]+;base64,[^\)]+)\)/).map((part, i) => {
                          if (part.startsWith("data:image/")) {
                            return <img key={i} src={part} alt="Uploaded" className="rounded-lg max-h-60 object-contain shadow-sm bg-white/5" />;
                          }
                          return part ? <span key={i}>{part}</span> : null;
                        })}
                      </div>
                    ) : (
                      msg.content
                    )
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingText && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                  style={{ background: "var(--color-accent-soft)" }}
                >
                  {isOpen ? "😊" : chatEmoji}
                </div>
                <div
                  className="max-w-[80%] sm:max-w-[72%] text-[15px] leading-relaxed prose-chat max-w-none"
                  style={{
                    color: "var(--color-text-primary)",
                    padding: "2px 0",
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingText}
                  </ReactMarkdown>
                  <span
                    className="inline-block w-1 h-4 ml-0.5 -mb-0.5 rounded-sm animate-pulse"
                    style={{ background: "var(--color-accent)" }}
                  />
                </div>
              </div>
            )}

            {/* Thinking dots */}
            {isStreaming && !streamingText && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                  style={{ background: "var(--color-accent-soft)" }}
                >
                  {isOpen ? "😊" : chatEmoji}
                </div>
                <div className="flex items-center gap-4 py-2">
                  <div className="flex gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce-dot"
                      style={{
                        background: "var(--color-accent)",
                        animationDelay: "0ms",
                      }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce-dot"
                      style={{
                        background: "var(--color-accent)",
                        animationDelay: "150ms",
                      }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce-dot"
                      style={{
                        background: "var(--color-accent)",
                        animationDelay: "300ms",
                      }}
                    />
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {isOpen ? "Linh đang gõ..." : "LinhIQ is thinking..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Input Bar ── */}
        <div
          className="flex-shrink-0 px-4 py-3 border-t"
          style={{
            background: "rgba(23,23,23,0.92)",
            backdropFilter: "blur(16px)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <div className="max-w-2xl mx-auto flex gap-2 items-end">
            <div
              className="flex-1 flex items-end gap-2 rounded-xl border px-4 py-2.5"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border-default)",
                transition: "border-color 0.15s",
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--color-accent)";
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--color-border-default)";
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={autoResize}
                onPaste={handlePaste}
                placeholder={isOpen ? "Nói gì với Linh đi..." : "Ask LinhIQ... or paste/upload a photo 📷"}
                disabled={isStreaming}
                rows={1}
                className="flex-1 bg-transparent text-sm resize-none outline-none"
                style={{
                  color: "var(--color-text-primary)",
                  minHeight: "24px",
                  maxHeight: "144px",
                  lineHeight: "1.6",
                }}
              />
              {/* Hidden file input for Camera button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) loadImageFile(file);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                className="flex-shrink-0 p-1 rounded-md transition-colors"
                style={{
                  color: imagePreview
                    ? "var(--color-accent)"
                    : "var(--color-text-muted)",
                }}
                title="Upload photo (or paste with Ctrl+V)"
              >
                <Camera size={18} />
              </button>
            </div>
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && !imageBase64) || isStreaming}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{
                background:
                  (input.trim() || imageBase64) && !isStreaming
                    ? "var(--color-accent)"
                    : "var(--color-surface)",
                color:
                  (input.trim() || imageBase64) && !isStreaming
                    ? "#fff"
                    : "var(--color-text-muted)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <Send size={16} />
            </button>
          </div>

          {/* Image preview chip */}
          {imagePreview && (
            <div className="max-w-2xl mx-auto mt-2 flex items-center gap-2">
              <div
                className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg"
                style={{
                  background: "var(--color-elevated)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                <img
                  src={imagePreview}
                  alt="preview"
                  className="h-10 w-10 object-cover rounded-md"
                />
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Image attached
                </span>
                <button
                  onClick={clearImage}
                  className="p-0.5 rounded-full transition-colors"
                  style={{ color: "var(--color-text-muted)" }}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Ctrl+V to paste another
              </span>
            </div>
          )}

          <p
            className="text-center text-xs mt-1.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* ── Right Roadmap Sidebar (desktop, subject mode only) ── */}
      {isSubject && (
        <MilestoneRoadmapSidebar
          milestones={milestones}
          isOpen={roadmapOpen}
          onToggle={() => setRoadmapOpen((p) => !p)}
          activeTopicId={activeTopicId}
          recentlyUpdatedTopicId={recentlyUpdatedTopicId}
          subjectName={session.subject?.name}
          onTopicClick={(topic: TopicMastery) => {
            setInput(`Can you help me understand "${topic.name}"?`);
            inputRef.current?.focus();
          }}
          onQuizTopic={(topicId, topicName) =>
            setQuizState({ open: true, type: "topic", targetId: topicId, targetName: topicName })
          }
          onQuizMilestone={(milestoneId, milestoneName) =>
            setQuizState({ open: true, type: "milestone", targetId: milestoneId, targetName: milestoneName })
          }
        />
      )}

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around h-16 border-t"
        style={{
          background: "rgba(23,23,23,0.95)",
          backdropFilter: "blur(16px)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isChatActive = href === "/chat";
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-4 py-2"
              style={{
                color: isChatActive
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
              }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile Roadmap Bottom Sheet ── */}
      {isSubject && mobileRoadmapOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileRoadmapOpen(false);
          }}
        >
          <div
            className="rounded-t-2xl overflow-hidden flex flex-col"
            style={{
              background: "var(--color-void)",
              maxHeight: "75vh",
              border: "1px solid var(--color-border-default)",
            }}
          >
            {/* Sheet handle */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Map
                  size={16}
                  style={{ color: "var(--color-accent)" }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {session.subject?.name} — Roadmap
                </span>
              </div>
              <button
                onClick={() => setMobileRoadmapOpen(false)}
                style={{ color: "var(--color-text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Use MilestoneRoadmapContent (not Sidebar) so it renders on mobile without hidden md:flex */}
            <div className="flex-1 overflow-y-auto">
              <MilestoneRoadmapContent
                milestones={milestones}
                activeTopicId={activeTopicId}
                recentlyUpdatedTopicId={recentlyUpdatedTopicId}
                subjectName={undefined}
                onClose={() => setMobileRoadmapOpen(false)}
                onTopicClick={(topic: TopicMastery) => {
                  setInput(`Can you help me understand "${topic.name}"?`);
                  setMobileRoadmapOpen(false);
                  inputRef.current?.focus();
                }}
                onQuizTopic={(topicId, topicName) => {
                  setMobileRoadmapOpen(false);
                  setQuizState({ open: true, type: "topic", targetId: topicId, targetName: topicName });
                }}
                onQuizMilestone={(milestoneId, milestoneName) => {
                  setMobileRoadmapOpen(false);
                  setQuizState({ open: true, type: "milestone", targetId: milestoneId, targetName: milestoneName });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Quiz Modal ── */}
      {quizState?.open && session?.subject && (
        <QuizModal
          type={quizState.type}
          targetId={quizState.targetId}
          subjectId={session.subject.id}
          targetName={quizState.targetName}
          onClose={(masteryUpdates) => {
            setQuizState(null);
            // Apply mastery updates from quiz to local state
            if (masteryUpdates && masteryUpdates.length > 0) {
              setMilestones((prev) =>
                prev.map((milestone) => ({
                  ...milestone,
                  topics: milestone.topics.map((topic) => {
                    const update = masteryUpdates.find((u) => u.topicId === topic.id);
                    if (!update) return topic;
                    const newLevel = update.masteryLevel;
                    const tier =
                      newLevel >= 0.8 ? "excellent"
                      : newLevel >= 0.5 ? "good"
                      : newLevel > 0 ? "average"
                      : "not_started";
                    setRecentlyUpdatedTopicId(topic.id);
                    setTimeout(() => setRecentlyUpdatedTopicId(null), 4000);
                    return { ...topic, masteryLevel: newLevel, masteryTier: tier };
                  }),
                }))
              );
            }
          }}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return <ChatContent />;
}
