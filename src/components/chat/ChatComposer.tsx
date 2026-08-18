"use client";

import { FormEvent, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";

interface ChatComposerProps {
  value: string;
  disabled?: boolean;
  loading?: boolean;
  organisationName?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onPaste?: (text: string) => void;
}

export default function ChatComposer({
  value,
  disabled = false,
  loading = false,
  organisationName,
  onChange,
  onSubmit,
  onPaste,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, [value]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim() || disabled || loading) return;
    onSubmit();
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 rounded-[14px] border border-gray-300 bg-white px-3.5 py-2 shadow-sm"
      >
        <label htmlFor="brain-chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="brain-chat-input"
          ref={textareaRef}
          value={value}
          onChange={event => onChange(event.target.value)}
          onPaste={event => {
            const text = event.clipboardData.getData("text");
            if (text) onPaste?.(text);
          }}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit(event);
            }
          }}
          rows={1}
          placeholder="Ask about budgets, transactions, users…"
          disabled={disabled || loading}
          className="min-h-[26px] max-h-40 flex-1 resize-none border-0 bg-transparent py-1 text-[15px] leading-[26px] text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!value.trim() || disabled || loading}
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon icon="paperPlane" className="h-3.5 w-3.5" />
        </button>
      </form>
      <div className="flex items-center justify-between gap-3 px-0.5">
        <span className="text-xs leading-4 text-gray-500">
          Enter to send · Shift + Enter for a new line
        </span>
        {organisationName && (
          <span className="inline-flex items-center gap-1.5 text-xs leading-4 text-gray-500">
            <Icon icon="shieldHalved" className="h-2.5 w-2.5" />
            Scoped to {organisationName}
          </span>
        )}
      </div>
    </div>
  );
}
