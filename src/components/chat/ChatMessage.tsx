"use client";

import { useState } from "react";
import ChatMarkdown from "@/components/chat/ChatMarkdown";
import ChatTraceView from "@/components/chat/ChatTrace";
import { Icon } from "@/components/ui/Icon";
import type { ChatTrace } from "@/lib/chat-trace";

export interface DisplayChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  failed?: boolean;
  trace?: ChatTrace;
  live?: boolean;
  liveStatus?: string;
}

interface ChatMessageProps {
  message: DisplayChatMessage;
  onRetry?: () => void;
}

export default function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div
          className={`max-w-[78%] whitespace-pre-wrap rounded-[14px] bg-blue-600 px-3.5 py-2.5 text-[15px] leading-[23px] text-white ${
            message.failed ? "ring-1 ring-red-400" : ""
          }`}
        >
          {message.content}
        </div>
        {message.failed && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs leading-4 text-red-600 hover:bg-red-50"
          >
            <Icon icon="arrowRotateLeft" className="h-2.5 w-2.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3.5">
      <div className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50">
        <Icon icon="comments" className="h-3 w-3 text-blue-600" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {(message.trace || message.live) && (
          <ChatTraceView
            key={message.live ? "live" : "done"}
            trace={message.trace ?? { elapsedMs: 0, steps: [] }}
            live={message.live}
            liveStatus={message.liveStatus}
          />
        )}
        {message.content && (
          <div className="text-[15px] leading-[26px] text-gray-900">
            <ChatMarkdown content={message.content} />
          </div>
        )}
        {message.content && !message.live && (
          <div className="-ml-1.5 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs leading-4 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
            >
              <Icon icon="copy" className="h-2.5 w-2.5" />
              {copied ? "Copied" : "Copy"}
            </button>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs leading-4 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
              >
                <Icon icon="arrowRotateLeft" className="h-2.5 w-2.5" />
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
