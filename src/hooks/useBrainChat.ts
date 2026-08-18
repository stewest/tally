import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BrainActivityEvent, ChatTrace } from "@/lib/chat-trace";

export interface BrainChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SendBrainChatParams {
  message: string;
  sessionId?: string | null;
  onDelta?: (delta: string) => void;
  onSession?: (sessionId: string) => void;
  onActivity?: (event: BrainActivityEvent) => void;
}

export interface BrainChatResult {
  reply: string;
  sessionId: string;
  history: BrainChatHistoryMessage[];
  title?: string;
  trace?: ChatTrace;
}

export function getChatErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return "Failed to send message.";
}

function parseSseEvent(block: string): ChatStreamEvent | null {
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice("data:".length).trim();
    if (!payload) continue;
    try {
      return JSON.parse(payload) as ChatStreamEvent;
    } catch {
      return null;
    }
  }
  return null;
}

function toActivity(event: ChatStreamEvent): BrainActivityEvent | null {
  switch (event.type) {
    case "status":
      return { type: "status", phase: event.phase };
    case "thinking":
      return { type: "thinking", delta: event.delta };
    case "tool_call":
      return {
        type: "tool_call",
        id: event.id,
        name: event.name,
        params: event.params,
      };
    case "tool_result":
      return {
        type: "tool_result",
        id: event.id,
        name: event.name,
        ok: event.ok,
        label: event.label,
        result: event.result,
      };
    case "text":
      return { type: "text", delta: event.delta };
    default:
      return null;
  }
}

async function readChatStream(
  message: string,
  sessionId: string | null,
  onDelta?: (delta: string) => void,
  onSession?: (sessionId: string) => void,
  onActivity?: (event: BrainActivityEvent) => void
): Promise<BrainChatResult> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      message,
      sessionId: sessionId ?? undefined,
    } satisfies ChatRequest),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const json = (await response.json()) as ChatResponse;
    throw new Error(
      json.error || `Chat failed (${response.status} ${response.statusText})`
    );
  }

  if (!response.body) {
    throw new Error("Chat returned an empty stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: BrainChatResult | null = null;
  let streamError: string | null = null;

  const consumeBlock = (block: string) => {
    const event = parseSseEvent(block);
    if (!event) return;

    switch (event.type) {
      case "session":
        onSession?.(event.sessionId);
        break;
      case "text":
        if (event.delta) onDelta?.(event.delta);
        onActivity?.({ type: "text", delta: event.delta });
        break;
      case "status":
      case "thinking":
      case "tool_call":
      case "tool_result": {
        const activity = toActivity(event);
        if (activity) onActivity?.(activity);
        break;
      }
      case "done":
        result = {
          reply: event.reply,
          sessionId: event.sessionId,
          history: event.history,
          title: event.title,
          trace: event.trace,
        };
        break;
      case "error":
        streamError = event.message;
        break;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separator = buffer.indexOf("\n\n");
    while (separator !== -1) {
      consumeBlock(buffer.slice(0, separator));
      buffer = buffer.slice(separator + 2);
      separator = buffer.indexOf("\n\n");
    }
  }

  if (buffer.trim()) {
    consumeBlock(buffer);
  }

  if (streamError) {
    throw new Error(streamError);
  }
  if (!result) {
    throw new Error("Chat stream ended without a reply.");
  }

  return result;
}

/**
 * Sends a user message to `POST /api/ai/chat` and streams Brain activity.
 */
export function useBrainChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      message,
      sessionId = null,
      onDelta,
      onSession,
      onActivity,
    }: SendBrainChatParams): Promise<BrainChatResult> => {
      try {
        return await readChatStream(
          message,
          sessionId,
          onDelta,
          onSession,
          onActivity
        );
      } catch (error) {
        throw new Error(getChatErrorMessage(error));
      }
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
      queryClient.invalidateQueries({
        queryKey: ["chatSession", result.sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
