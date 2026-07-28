"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export default function ChatMarkdown({
  content,
  className = "",
}: ChatMarkdownProps) {
  return (
    <div className={`chat-markdown text-sm ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-2 last:mb-0 list-disc pl-5 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 last:mb-0 list-decimal pl-5 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ className: codeClassName, children }) => {
            const isBlock = Boolean(codeClassName?.includes("language-"));
            if (isBlock) {
              return (
                <code className="block text-xs font-mono whitespace-pre overflow-x-auto">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded px-1 py-0.5 text-xs font-mono bg-black/10">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-2 last:mb-0 rounded-md bg-black/10 p-3 overflow-x-auto">
              {children}
            </pre>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-semibold mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-1.5">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2 last:mb-0 border-l-2 border-gray-300 pl-3 text-gray-600">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mb-2 last:mb-0 overflow-x-auto">
              <table className="min-w-full text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-2 py-1 text-left font-semibold bg-black/5">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-2 py-1 align-top">
              {children}
            </td>
          ),
          hr: () => <hr className="my-3 border-gray-300" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
