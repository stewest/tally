import { NextRequest, NextResponse } from "next/server";

import { authenticateToolsRequest, executeTool } from "@/server/tools";

/**
 * Public tools webhook — surface a deployed Telos Brain calls back into.
 *
 * `POST /api/tools/{toolId}` invokes a single host tool by name, scoped
 * to `organisationId`.
 *
 * Dual-secret handshake:
 * - `Authorization: Bearer <TOOL_API_KEY>`
 * - `X-Brain-Authorization: Bearer <BRAIN_API_KEY>`
 *
 * Body: a flat JSON object of the tool's parameters plus the reserved keys
 * `organisationId` (required) and `userId` (optional). A nested
 * `{ parameters: {...} }` object is also accepted for direct callers.
 *
 *   { "organisationId": "<uuid>", ... }
 */

export const maxDuration = 300;

interface ToolsRequestBody {
  organisationId?: string;
  userId?: string;
  parameters?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ToolsResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

// Reserved top-level body keys that are not forwarded as tool parameters.
const RESERVED_KEYS = new Set(["organisationId", "userId", "parameters"]);

interface RouteContext {
  params: Promise<{ toolId: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ToolsResponse>> {
  const auth = authenticateToolsRequest(request.headers);
  if (!auth.ok) {
    return NextResponse.json<ToolsResponse>(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  const { toolId } = await params;

  let body: ToolsRequestBody;
  try {
    body = (await request.json()) as ToolsRequestBody;
  } catch {
    return NextResponse.json<ToolsResponse>(
      { success: false, error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json<ToolsResponse>(
      { success: false, error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  if (!body.organisationId || typeof body.organisationId !== "string") {
    return NextResponse.json<ToolsResponse>(
      { success: false, error: "organisationId is required." },
      { status: 400 }
    );
  }

  // Prefer an explicit `parameters` object; otherwise treat the remaining
  // top-level fields (minus reserved keys) as the tool parameters.
  let parameters: Record<string, unknown>;
  if (body.parameters && typeof body.parameters === "object") {
    parameters = body.parameters;
  } else {
    parameters = {};
    for (const [key, value] of Object.entries(body)) {
      if (!RESERVED_KEYS.has(key)) parameters[key] = value;
    }
  }

  const outcome = await executeTool({
    toolName: toolId,
    organisationId: body.organisationId,
    parameters,
    userId: typeof body.userId === "string" ? body.userId : null,
  });

  return NextResponse.json<ToolsResponse>(
    outcome.success
      ? { success: true, result: outcome.result }
      : { success: false, error: outcome.error },
    { status: outcome.status }
  );
}
