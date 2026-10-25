"use client";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="prose prose-zinc prose-chat max-w-none text-[15px] leading-[1.7] prose-headings:font-semibold prose-headings:tracking-tight prose-strong:text-ink prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});
