import { useMutation } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";

export interface BrainChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SendBrainChatParams {
  message: string;
  history?: BrainChatHistoryMessage[];
  historySignature?: string | null;
}

export interface BrainChatResult {
  reply: string;
  history: BrainChatHistoryMessage[];
  historySignature: string;
}

export function getChatErrorMessage(error: unknown): string {
  if (isAxiosError<ChatResponse>(error)) {
    const fromBody = error.response?.data?.error;
    if (typeof fromBody === "string" && fromBody.length > 0) {
      return fromBody;
    }
    if (error.response) {
      return `${error.response.status} ${error.response.statusText}`;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Failed to send message.";
}

/**
 * Sends a user message (plus server-signed prior turns) to `POST /api/ai/chat`.
 */
export function useBrainChat() {
  return useMutation({
    mutationFn: async ({
      message,
      history = [],
      historySignature = null,
    }: SendBrainChatParams): Promise<BrainChatResult> => {
      try {
        const response = await axios.post<ChatResponse>("/api/ai/chat", {
          message,
          history,
          historySignature: historySignature ?? undefined,
        } satisfies ChatRequest);

        const data = response.data.data;
        if (
          !response.data.success ||
          !data?.reply ||
          !data.history ||
          !data.historySignature
        ) {
          throw new Error(response.data.error || "Chat returned no reply.");
        }

        return {
          reply: data.reply,
          history: data.history,
          historySignature: data.historySignature,
        };
      } catch (error) {
        throw new Error(getChatErrorMessage(error));
      }
    },
  });
}
