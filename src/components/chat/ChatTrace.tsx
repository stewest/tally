"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  formatJsonBlock,
  formatTraceDuration,
  formatTraceSummary,
  type ChatTrace,
  type ChatTraceTool,
} from "@/lib/chat-trace";

interface ChatTraceProps {
  trace: ChatTrace;
  live?: boolean;
  liveStatus?: string;
}

function TimelineMark({
  kind,
  status,
}: {
  kind: "thought" | "tool";
  status?: ChatTraceTool["status"];
}) {
  if (kind === "thought") {
    return (
      <span
        aria-hidden
        className="absolute top-2 left-[-16.5px] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-gray-300"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="absolute top-[5px] left-[-16.5px] flex h-[13px] w-[13px] -translate-x-1/2 items-center justify-center bg-gray-50"
    >
      {status === "running" ? (
        <Icon
          icon="circleNotch"
          className="chat-trace-spin h-2.5 w-2.5 text-blue-600"
        />
      ) : (
        <Icon icon="check" className="h-[8px] text-blue-600" />
      )}
    </span>
  );
}

function ToolStep({ step }: { step: ChatTraceTool }) {
  const [open, setOpen] = useState(false);
  const result = step.result?.trim();

  return (
    <div className="chat-trace-in relative flex items-start gap-2.5">
      <TimelineMark kind="tool" status={step.status} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(current => !current)}
          className="flex flex-wrap items-center gap-2 bg-transparent p-0 text-left"
        >
          <code className="rounded-[5px] border border-gray-200 bg-white px-1.5 py-px font-mono text-xs leading-[18px] text-gray-900">
            {step.tool}
          </code>
          <span className="text-[12.5px] leading-[18px] text-gray-500">
            {step.label}
          </span>
          <Icon
            icon={open ? "chevronDown" : "chevronRight"}
            className="h-2 w-2 text-gray-400"
          />
        </button>
        {open && (
          <div className="flex flex-col gap-2.5 pb-0.5">
            <JsonBlock label="Parameters" value={step.params} maxHeight={160} />
            {result && (
              <JsonBlock label="Result" value={result} maxHeight={200} />
            )}
          </div>
        )}
      </div>
      {step.durationMs != null && (
        <span className="shrink-0 text-[11px] leading-[18px] text-gray-500">
          {formatTraceDuration(step.durationMs)}
        </span>
      )}
    </div>
  );
}

function JsonBlock({
  label,
  value,
  maxHeight,
}: {
  label: string;
  value: string | undefined;
  maxHeight: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] leading-[14px] font-semibold tracking-[0.04em] text-gray-500 uppercase">
        {label}
      </span>
      <pre
        className="overflow-auto rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-mono text-[11.5px] leading-[18px] text-gray-600"
        style={{ maxHeight }}
      >
        {formatJsonBlock(value)}
      </pre>
    </div>
  );
}

export default function ChatTraceView({
  trace,
  live = false,
  liveStatus,
}: ChatTraceProps) {
  const [open, setOpen] = useState(false);
  if (trace.steps.length === 0 && !live) {
    return null;
  }

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(current => !current)}
          className="inline-flex items-center gap-2 bg-transparent p-0 text-[12.5px] leading-[18px] text-gray-500 hover:text-gray-900"
        >
          <Icon
            icon={open ? "chevronDown" : "chevronRight"}
            className="h-[9px] w-[9px]"
          />
          <span>{formatTraceSummary(trace, live)}</span>
        </button>
        {live && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="chat-dot-pulse h-[5px] w-[5px] rounded-full bg-blue-600" />
              <span
                className="chat-dot-pulse h-[5px] w-[5px] rounded-full bg-blue-600"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="chat-dot-pulse h-[5px] w-[5px] rounded-full bg-blue-600"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
            <span className="text-[12.5px] leading-[18px] text-gray-500">
              {liveStatus ?? "Sending to Telos Brain"}
            </span>
          </div>
        )}
      </div>

      {open && trace.steps.length > 0 && (
        <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
          <div className="flex flex-col gap-3.5 border-l border-gray-200 pl-4">
            {trace.steps.map(step =>
              step.kind === "thought" ? (
                <div
                  key={step.id}
                  className="chat-trace-in relative flex items-start gap-2.5"
                >
                  <TimelineMark kind="thought" />
                  <p className="min-w-0 flex-1 text-[13px] leading-5 text-gray-600">
                    {step.label}
                  </p>
                </div>
              ) : (
                <ToolStep key={step.id} step={step} />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
