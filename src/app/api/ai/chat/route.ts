import { NextRequest, NextResponse } from "next/server";
import { Role } from "@db/schema";
import { requireRole } from "@/server/api-auth";
import {
  type ChatHistoryMessage,
  signChatHistory,
  verifyChatHistory,
} from "@/server/brain/chat-history";
import { isBrainConfigured, runWorkflowSync } from "@/server/brain/client";
import { ensureBrainEntityForOrganisation } from "@/server/brain/entities";

/** Deploy code of the starter-brain chat workflow (`brain/workflows/chat.md`). */
const CHAT_WORKFLOW_CODE = "WF-CHAT";

/** Cap history so the prompt stays within a reasonable size. */
const MAX_HISTORY_MESSAGES = 40;

export const maxDuration = 300;

interface ChatRequestBody {
  message?: string;
  history?: ChatHistoryMessage[];
  historySignature?: string;
}

function parseHistory(raw: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (entry): entry is ChatHistoryMessage =>
        !!entry &&
        typeof entry === "object" &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string" &&
        entry.content.trim().length > 0
    )
    .map(entry => ({
      role: entry.role,
      content: entry.content.trim(),
    }))
    .slice(-MAX_HISTORY_MESSAGES);
}

function buildInputMessage(
  history: ChatHistoryMessage[],
  message: string
): string {
  if (history.length === 0) {
    return message;
  }

  const transcript = history
    .map(
      entry =>
        `${entry.role === "user" ? "User" : "Assistant"}: ${entry.content}`
    )
    .join("\n\n");

  return `${transcript}\n\nUser: ${message}`;
}

/**
 * POST /api/ai/chat — run the Brain `WF-CHAT` workflow for the current org.
 *
 * Body:
 * `{ "message": "<user text>", "history": [...], "historySignature": "..." }`
 *
 * `history` must be accompanied by a server-issued `historySignature` so
 * clients cannot forge assistant turns. Auth: Clerk session + organisation.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireRole(Role.Member);
  if (error) return error;

  if (!isBrainConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Telos Brain is not configured. Set BRAIN_URL and BRAIN_API_KEY.",
      } satisfies ChatResponse,
      { status: 503 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Request body must be valid JSON.",
      } satisfies ChatResponse,
      { status: 400 }
    );
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json(
      { success: false, error: "message is required." } satisfies ChatResponse,
      { status: 400 }
    );
  }

  const requestedHistory = parseHistory(body.history);
  const history = verifyChatHistory(
    user.organisation.id,
    requestedHistory,
    body.historySignature
  );

  if (history === null) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid conversation history. Start a new chat.",
      } satisfies ChatResponse,
      { status: 400 }
    );
  }

  try {
    let entityId: string | undefined;
    try {
      const ensured = await ensureBrainEntityForOrganisation(
        user.organisation.id
      );
      entityId = ensured ?? undefined;
    } catch (entityError) {
      console.error(
        "Failed to ensure Brain entity for chat; continuing without entityId:",
        entityError
      );
    }

    const reply = await runWorkflowSync(CHAT_WORKFLOW_CODE, {
      inputMessage: buildInputMessage(history, message),
      entityId,
    });

    const nextHistory = (
      [
        ...history,
        { role: "user" as const, content: message },
        { role: "assistant" as const, content: reply },
      ] satisfies ChatHistoryMessage[]
    ).slice(-MAX_HISTORY_MESSAGES);

    const historySignature = signChatHistory(
      user.organisation.id,
      nextHistory
    );

    return NextResponse.json({
      success: true,
      data: {
        reply,
        history: nextHistory,
        historySignature,
      },
    } satisfies ChatResponse);
  } catch (err) {
    console.error("Error in POST /api/ai/chat:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run chat workflow.",
      } satisfies ChatResponse,
      { status: 502 }
    );
  }
}
