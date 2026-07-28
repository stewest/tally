import { timingSafeEqual } from "node:crypto";
import { getOrganisation } from "@/server/organisation";
import { hostTools } from "@/server/tools/host-tools";

/**
 * Host tools dispatch — HTTP layer for Telos Brain tool callbacks (`/api/tools`).
 *
 * Dual-secret handshake (both required):
 * 1. `Authorization: Bearer <TOOL_API_KEY>` — shared webhook secret
 * 2. `X-Brain-Authorization: Bearer <BRAIN_API_KEY>` — proves the caller has
 *    this brain's execution key (injected by Brain from its `.env` via `secret:`)
 *
 * Organisation scope is supplied per request (`organisationId` in the body),
 * typically injected from the current entity's `organisationId` variable.
 */

/** Header Brain must send with the per-brain execution API key. */
export const BRAIN_AUTHORIZATION_HEADER = "x-brain-authorization";

/** Result of authenticating a tools request. */
export type ToolsAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: string };

function timingSafeStringEqual(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) {
    // Compare against itself so the failure path still does constant work.
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

function extractBearerToken(headerValue: string | null): string | null {
  const prefix = "Bearer ";
  if (!headerValue?.startsWith(prefix)) {
    return null;
  }
  const token = headerValue.slice(prefix.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Validates the dual-secret Brain handshake on a tools request.
 *
 * Returns `500` when required env keys are missing (fail closed), and `401`
 * when either header is missing or does not match.
 */
export function authenticateToolsRequest(headers: Headers): ToolsAuthResult {
  const expectedToolKey = process.env.TOOL_API_KEY;
  const expectedBrainKey = process.env.BRAIN_API_KEY;

  if (!expectedToolKey) {
    return {
      ok: false,
      status: 500,
      error: "Tool API is not configured (TOOL_API_KEY is unset).",
    };
  }

  if (!expectedBrainKey) {
    return {
      ok: false,
      status: 500,
      error:
        "Brain handshake is not configured (BRAIN_API_KEY is unset). Tools require the dual-secret handshake.",
    };
  }

  const toolToken = extractBearerToken(headers.get("authorization"));
  if (!toolToken || !timingSafeStringEqual(toolToken, expectedToolKey)) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or missing tool API key.",
    };
  }

  const brainToken = extractBearerToken(
    headers.get(BRAIN_AUTHORIZATION_HEADER)
  );
  if (!brainToken || !timingSafeStringEqual(brainToken, expectedBrainKey)) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or missing Brain handshake credentials.",
    };
  }

  return { ok: true };
}

export interface ExecuteToolParams {
  toolName: string;
  organisationId: string;
  parameters: Record<string, unknown>;
  userId?: string | null;
}

export interface ExecuteToolResult {
  success: boolean;
  /** Tool's native return value. */
  result?: unknown;
  error?: string;
  /** HTTP status the route should respond with. */
  status: number;
}

/**
 * Executes a single host tool by name with the supplied parameters, scoped
 * to `organisationId`. Assumes the caller has already been authenticated.
 * Rejects unknown organisations so a leaked key cannot probe arbitrary UUIDs
 * that are not real tenants.
 */
export async function executeTool({
  toolName,
  organisationId,
  parameters,
  userId = null,
}: ExecuteToolParams): Promise<ExecuteToolResult> {
  const organisation = await getOrganisation(organisationId);
  if (!organisation) {
    return {
      success: false,
      error: "Organisation not found.",
      status: 404,
    };
  }

  const tool = hostTools[toolName];

  if (!tool) {
    return {
      success: false,
      error: `Tool '${toolName}' not found.`,
      status: 404,
    };
  }

  try {
    const result = await tool(parameters, { organisationId, userId });
    return { success: true, result, status: 200 };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Tool execution failed.",
      status: 500,
    };
  }
}
