"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import BaseCard from "@/components/ui/BaseCard";
import Button from "@/components/buttons/Button";
import ChatMarkdown from "@/components/chat/ChatMarkdown";
import { Icon } from "@/components/ui/Icon";
import {
  type BrainChatHistoryMessage,
  useBrainChat,
} from "@/hooks/useBrainChat";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface BrainChatProps {
  className?: string;
  /** Stretch to fill the parent height (used on /chat). */
  fillHeight?: boolean;
}

function toDisplayMessages(
  history: BrainChatHistoryMessage[]
): DisplayMessage[] {
  return history.map(message => ({
    id: crypto.randomUUID(),
    role: message.role,
    content: message.content,
  }));
}

export default function BrainChat({
  className = "",
  fillHeight = false,
}: BrainChatProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [signedHistory, setSignedHistory] = useState<BrainChatHistoryMessage[]>(
    []
  );
  const [historySignature, setHistorySignature] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chat = useBrainChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || chat.isPending) return;

    setError(null);
    setInput("");

    const optimisticUser: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };
    setMessages(prev => [...prev, optimisticUser]);

    try {
      const result = await chat.mutateAsync({
        message,
        history: signedHistory,
        historySignature,
      });
      setSignedHistory(result.history);
      setHistorySignature(result.historySignature);
      setMessages(toDisplayMessages(result.history));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
      // Drop the optimistic user bubble on failure.
      setMessages(toDisplayMessages(signedHistory));
    }
  };

  return (
    <BaseCard
      className={`flex flex-col ${
        fillHeight
          ? "h-full min-h-0"
          : "min-h-[28rem] max-h-[36rem]"
      } ${className}`}
    >
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Icon icon="robot" className="w-5 h-5 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Chat</h2>
          <p className="text-sm text-gray-500">
            Powered by the Brain <code className="text-xs">WF-CHAT</code>{" "}
            workflow
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 min-h-0">
        {messages.length === 0 && !chat.isPending && (
          <p className="text-sm text-gray-500">
            Ask anything about your organisation. Messages are sent to Telos
            Brain and scoped to your current organisation.
          </p>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "bg-blue-600 text-white whitespace-pre-wrap"
                  : "bg-gray-100 text-gray-900 border border-gray-200"
              }`}
            >
              {message.role === "assistant" ? (
                <ChatMarkdown content={message.content} />
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}

        {chat.isPending && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500 border border-gray-200">
              Thinking…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3 shrink-0" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 items-end shrink-0"
      >
        <label htmlFor="brain-chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="brain-chat-input"
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit(event);
            }
          }}
          rows={2}
          placeholder="Type a message…"
          disabled={chat.isPending}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none text-black text-sm resize-none disabled:opacity-50"
        />
        <Button
          type="submit"
          loading={chat.isPending}
          disabled={!input.trim() || chat.isPending}
          className="shrink-0"
        >
          <span className="inline-flex items-center gap-2">
            <Icon icon="paperPlane" className="w-4 h-4" />
            Send
          </span>
        </Button>
      </form>
    </BaseCard>
  );
}
