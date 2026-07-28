import { createHmac, timingSafeEqual } from "node:crypto";

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface SignedHistoryPayload {
  organisationId: string;
  messages: ChatHistoryMessage[];
}

function getHistorySigningSecret(): string {
  const secret = process.env.BRAIN_API_KEY || process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "No signing secret available for chat history (set BRAIN_API_KEY or CLERK_SECRET_KEY)."
    );
  }
  return secret;
}

function canonicalPayload(payload: SignedHistoryPayload): string {
  return JSON.stringify({
    organisationId: payload.organisationId,
    messages: payload.messages.map(message => ({
      role: message.role,
      content: message.content,
    })),
  });
}

/** Creates an HMAC signature over org-scoped chat history. */
export function signChatHistory(
  organisationId: string,
  messages: ChatHistoryMessage[]
): string {
  const payload: SignedHistoryPayload = { organisationId, messages };
  return createHmac("sha256", getHistorySigningSecret())
    .update(canonicalPayload(payload))
    .digest("base64url");
}

/**
 * Verifies a client-echoed history was issued by this server for this org.
 * Returns the trusted messages, or null if the signature is missing/invalid.
 */
export function verifyChatHistory(
  organisationId: string,
  messages: ChatHistoryMessage[],
  signature: string | null | undefined
): ChatHistoryMessage[] | null {
  if (messages.length === 0) {
    return [];
  }

  if (!signature || typeof signature !== "string") {
    return null;
  }

  const expected = signChatHistory(organisationId, messages);
  const providedBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return null;
  }

  if (!timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  return messages;
}
