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
    <div className={`chat-markdown text-[15px] leading-[26px] ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-3 last:mb-0 flex list-disc flex-col gap-1.5 pl-[22px]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 last:mb-0 flex list-decimal flex-col gap-1.5 pl-[22px]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-[26px]">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 no-underline border-b border-blue-200"
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
            <div className="mb-3 last:mb-0 overflow-hidden rounded-[10px] border border-gray-200">
              <table className="w-full border-collapse text-[13px] leading-5 [&_tr:last-child_td]:border-b-0">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-gray-100 px-3 py-2 align-top text-gray-900">
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
