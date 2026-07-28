/**
 * Client for the Telos Brain Execution API.
 *
 * The Execution API is the runtime surface of a deployed Telos Brain. It is
 * addressed by the brain service host (`BRAIN_URL`) and authenticated with the
 * per-brain execution API key (`BRAIN_API_KEY`) presented as a bearer token.
 * The key resolves to a single active brain, which becomes the implicit tenant
 * scope for the request — no brain id is ever sent in the body or route.
 *
 * All HTTP calls use axios (no fetch).
 */
import axios, { type AxiosInstance, isAxiosError } from "axios";
import type { Readable } from "node:stream";

/** Shared request body accepted by both run endpoints. All fields optional. */
export interface RunWorkflowOptions {
  /** The triggering user message. */
  inputMessage?: string;
  /** Optional runtime entity scope (GUID). */
  entityId?: string;
  /** Optional runtime unit-of-work scope (GUID). */
  unitOfWorkId?: string;
  /** Honoured on the async path only. */
  callbackUrl?: string;
}

export interface BrainConfig {
  baseUrl: string;
  apiKey: string;
}

interface BrainErrorBody {
  error?: string;
}

/**
 * Returns true when both Brain Execution API env vars are set.
 * Used for fail-soft behaviour (e.g. local dev without a deployed brain).
 */
export function isBrainConfigured(): boolean {
  return Boolean(process.env.BRAIN_URL && process.env.BRAIN_API_KEY);
}

/**
 * Reads and validates the brain execution API configuration from the
 * environment. Throws when either variable is missing.
 */
export function getBrainConfig(): BrainConfig {
  const baseUrl = process.env.BRAIN_URL;
  const apiKey = process.env.BRAIN_API_KEY;

  if (!baseUrl) {
    throw new Error(
      "BRAIN_URL is not configured. Set it to the Telos Brain execution API base URL."
    );
  }
  if (!apiKey) {
    throw new Error(
      "BRAIN_API_KEY is not configured. Set it to the per-brain execution API key."
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

/**
 * Extracts a human-readable detail from an axios (or other) failure.
 * Prefer `{ error }` from the Brain JSON body when present.
 */
async function getBrainErrorDetail(
  error: unknown,
  fallback: string
): Promise<string> {
  if (!isAxiosError<BrainErrorBody | Readable>(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data;

  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string" &&
    data.error.length > 0
  ) {
    return data.error;
  }

  // Streamed error bodies (e.g. failed sync run with responseType: "stream").
  if (data && typeof (data as Readable).on === "function") {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of data as Readable) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const text = Buffer.concat(chunks).toString("utf8").trim();
      if (text) {
        try {
          const parsed = JSON.parse(text) as BrainErrorBody;
          if (parsed.error) return parsed.error;
        } catch {
          return text;
        }
      }
    } catch {
      // Fall through to status / message.
    }
  }

  if (error.response) {
    return `${error.response.status} ${error.response.statusText}`;
  }

  if (error.code === "ECONNABORTED") {
    return "Request timed out";
  }

  return error.message || fallback;
}

/** Creates an axios instance scoped to the configured Brain Execution API. */
function createBrainAxios(): AxiosInstance {
  const { baseUrl, apiKey } = getBrainConfig();

  return axios.create({
    baseURL: baseUrl,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    // Brain agent runs can be long; individual calls override when needed.
    timeout: 60_000,
    validateStatus: status => status >= 200 && status < 300,
  });
}

/** A single entity variable key/value pair. */
export interface BrainEntityVariable {
  key: string;
  value: string;
}

/** Request body for `POST /entities`. */
export interface CreateBrainEntityOptions {
  /** Deploy code of the entity type; must match a type in the brain schema. */
  entityTypeCode: string;
  name: string;
  description?: string;
  /** Key/value pairs bound to the entity's declared variable keys. */
  variables?: BrainEntityVariable[];
}

/** The entity object returned by the Execution API (subset we rely on). */
export interface BrainEntity {
  id: string;
  entityTypeId?: string;
  name?: string;
  description?: string;
  variables?: BrainEntityVariable[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Creates an entity on the deployed brain via `POST {BRAIN_URL}/entities`
 * and returns the created entity, including its generated `id`.
 */
export async function createBrainEntity(
  options: CreateBrainEntityOptions
): Promise<BrainEntity> {
  const client = createBrainAxios();

  try {
    const { data: entity } = await client.post<BrainEntity>(
      "/entities",
      options
    );

    if (!entity?.id) {
      throw new Error("Brain entity creation returned no entity id.");
    }

    return entity;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Brain entity creation returned no entity id."
    ) {
      throw error;
    }
    const detail = await getBrainErrorDetail(error, "Unknown error");
    throw new Error(`Brain entity creation failed: ${detail}`);
  }
}

/** One decoded Server-Sent Event from the sync run stream. */
interface BrainStreamEvent {
  type: "text" | "done" | "error" | string;
  delta?: string;
  message?: string;
}

async function consumeBrainSseStream(stream: Readable): Promise<string> {
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let streamError: string | null = null;
  let done = false;

  const consumeLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;

    const payload = trimmed.slice("data:".length).trim();
    if (!payload) return;

    let event: BrainStreamEvent;
    try {
      event = JSON.parse(payload) as BrainStreamEvent;
    } catch {
      return;
    }

    switch (event.type) {
      case "text":
        if (event.delta) text += event.delta;
        break;
      case "error":
        streamError = event.message ?? "Unknown brain workflow error.";
        break;
      case "done":
        done = true;
        break;
      default:
        break;
    }
  };

  for await (const chunk of stream) {
    const value = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk as string | Uint8Array);
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      consumeLine(buffer.slice(0, newlineIndex));
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf("\n");
      if (done) break;
    }
    if (done) break;
  }

  if (buffer) {
    consumeLine(buffer);
  }

  if (streamError) {
    throw new Error(`Brain workflow error: ${streamError}`);
  }

  return text;
}

/**
 * Runs a workflow synchronously against the deployed brain and returns the
 * full accumulated text once the stream completes.
 *
 * `POST {BRAIN_URL}/workflows/{code}/run/sync` streams the result as SSE.
 */
export async function runWorkflowSync(
  workflowCode: string,
  options: RunWorkflowOptions = {}
): Promise<string> {
  const client = createBrainAxios();

  try {
    const response = await client.post<Readable>(
      `/workflows/${encodeURIComponent(workflowCode)}/run/sync`,
      options,
      {
        responseType: "stream",
        headers: { Accept: "text/event-stream" },
        // Sync agent runs can exceed the default timeout.
        timeout: 0,
      }
    );

    if (!response.data) {
      throw new Error("Brain workflow run returned an empty stream.");
    }

    return await consumeBrainSseStream(response.data);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Brain workflow error:") ||
        error.message === "Brain workflow run returned an empty stream.")
    ) {
      throw error;
    }
    const detail = await getBrainErrorDetail(error, "Unknown error");
    throw new Error(`Brain workflow run failed: ${detail}`);
  }
}

/** Result of queuing an async workflow run. */
export interface AsyncRunResult {
  runId: string;
  status: string;
}

/**
 * Queues a workflow run on the deployed brain via
 * `POST {BRAIN_URL}/workflows/{code}/run/async` and returns immediately.
 */
export async function runWorkflowAsync(
  workflowCode: string,
  options: RunWorkflowOptions = {}
): Promise<AsyncRunResult> {
  const client = createBrainAxios();

  try {
    const { data } = await client.post<Partial<AsyncRunResult>>(
      `/workflows/${encodeURIComponent(workflowCode)}/run/async`,
      options
    );

    if (!data?.runId) {
      throw new Error("Brain workflow queue returned no run id.");
    }

    return { runId: data.runId, status: data.status ?? "queued" };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Brain workflow queue returned no run id."
    ) {
      throw error;
    }
    const detail = await getBrainErrorDetail(error, "Unknown error");
    throw new Error(`Brain workflow queue failed: ${detail}`);
  }
}
