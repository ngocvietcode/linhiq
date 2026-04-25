"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen } from "lucide-react";

interface Props {
  content: string;
  onJumpToPage?: (page: number) => void;
}

const PAGE_REF_RE = /\bp\.\s*(\d+)\b/g;

function preprocess(md: string): string {
  // Avoid touching URLs / existing markdown links containing p.X
  // Simple guard: skip lines starting with http or already inside ()
  return md.replace(PAGE_REF_RE, (match, num: string) => {
    return `[${match}](page://${num})`;
  });
}

export function CitationMarkdown({ content, onJumpToPage }: Props) {
  const processed = useMemo(() => preprocess(content), [content]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children, ...rest }) => {
          if (typeof href === "string" && href.startsWith("page://")) {
            const page = Number(href.replace("page://", ""));
            return (
              <button
                type="button"
                onClick={() => onJumpToPage?.(page)}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md text-[11px] font-semibold align-baseline transition-colors"
                style={{
                  background: "var(--color-accent-soft)",
                  color: "var(--color-accent)",
                  border: "1px solid var(--color-accent-border)",
                  lineHeight: 1.2,
                }}
                title={`Jump to page ${page}`}
              >
                <BookOpen size={10} />
                {children}
              </button>
            );
          }
          return (
            <a href={href} {...rest} target="_blank" rel="noreferrer">
              {children}
            </a>
          );
        },
      }}
    >
      {processed}
    </ReactMarkdown>
  );
}
