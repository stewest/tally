/**
 * Host-app tools invoked by Telos Brain via the Tool API webhooks.
 *
 * These are plain functions (not Vercel AI SDK tools). The brain schema
 * (authored after `brain init`) should point each tool's `api.path` at
 * `/api/tools/{toolId}` and bind `organisationId` from the entity variable.
 */
import { db } from "@db/index";
import { profiles, memberships } from "@db/schema";
import { eq } from "drizzle-orm";

export interface ToolExecutionContext {
  organisationId: string;
  userId?: string | null;
}

export type HostToolHandler = (
  parameters: Record<string, unknown>,
  context: ToolExecutionContext
) => Promise<unknown>;

export async function getUsersForOrganisation(
  _parameters: Record<string, unknown>,
  context: ToolExecutionContext
) {
  const { organisationId } = context;

  if (!organisationId) {
    throw new Error("Organisation ID is required");
  }

  return db
    .select()
    .from(profiles)
    .innerJoin(memberships, eq(profiles.id, memberships.userId))
    .where(eq(memberships.organisationId, organisationId));
}

/** Registry of tools exposed at `/api/tools/{toolId}`. */
export const hostTools: Record<string, HostToolHandler> = {
  getUsers: getUsersForOrganisation,
};
