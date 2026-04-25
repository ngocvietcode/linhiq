"use client";

import { BookOpen, Target, HelpCircle, GraduationCap } from "lucide-react";

export interface QuickAction {
  key: string;
  label: string;
  prompt: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface Props {
  pageNumber: number;
  topicName: string | null;
  chapterName: string | null;
  disabled?: boolean;
  onTrigger: (prompt: string) => void;
}

export function QuickActionChips({
  pageNumber,
  topicName,
  chapterName,
  disabled,
  onTrigger,
}: Props) {
  const ctx =
    topicName ?? chapterName ?? `trang ${pageNumber}`;

  const actions: QuickAction[] = [
    {
      key: "explain",
      label: "Giải thích",
      icon: BookOpen,
      prompt: `Giải thích nội dung chính của trang ${pageNumber}${topicName ? ` (chủ đề: ${topicName})` : ""}. Tập trung vào ý cốt lõi mà học sinh cần hiểu.`,
    },
    {
      key: "summary",
      label: "Tóm tắt",
      icon: Target,
      prompt: `Tóm tắt 3–5 ý chính ở trang ${pageNumber} dưới dạng bullet ngắn gọn. Mỗi ý kèm 1 ví dụ hoặc minh hoạ nếu có.`,
    },
    {
      key: "quiz",
      label: "Quiz tôi",
      icon: HelpCircle,
      prompt: `Tạo 3 câu hỏi kiểm tra hiểu bài về ${ctx}. Đánh số 1/2/3, không kèm đáp án — đợi tôi trả lời từng câu.`,
    },
    {
      key: "terms",
      label: "Khái niệm khó",
      icon: GraduationCap,
      prompt: `Liệt kê và giải thích ngắn gọn các thuật ngữ hoặc khái niệm khó ở trang ${pageNumber}${topicName ? ` thuộc chủ đề ${topicName}` : ""}. Mỗi mục: thuật ngữ + giải thích 1–2 câu.`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.key}
            onClick={() => onTrigger(a.prompt)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "var(--color-surface-0)",
              border: "1px solid var(--color-border-subtle)",
              color: "var(--color-text-primary)",
            }}
            onMouseEnter={(e) => {
              if (disabled) return;
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--color-accent-soft)";
              el.style.borderColor = "var(--color-accent-border)";
              el.style.color = "var(--color-accent)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--color-surface-0)";
              el.style.borderColor = "var(--color-border-subtle)";
              el.style.color = "var(--color-text-primary)";
            }}
          >
            <Icon size={13} />
            <span className="truncate">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}
