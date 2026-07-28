/**
 * Maps app organisations onto Telos Brain entities.
 *
 * A brain workflow can only inject an organisation's UUID into a Tool API call
 * when the run is scoped to a brain entity whose `organisationId` variable holds
 * that UUID. Each organisation therefore needs a matching brain entity. The
 * entity id is created lazily on first use and cached on the organisation row
 * (`organisations.brain_entity_id`) so subsequent runs reuse it.
 *
 * The deployed brain schema (from `brain init`) must declare an entity type
 * with deploy code `organisation` and a variable key `organisationId`.
 */
import { db } from "@db/index";
import { organisations } from "@db/schema";
import { eq } from "drizzle-orm";
import { createBrainEntity, isBrainConfigured } from "@/server/brain/client";

/** Deploy code of the brain entity type organisations map onto. */
const ORGANISATION_ENTITY_TYPE_CODE = "organisation";

/**
 * Ensures the given organisation has a Telos Brain entity and returns its id.
 *
 * If the organisation already has a cached `brainEntityId`, it is returned
 * unchanged. Otherwise a brain entity is created via the Execution API with the
 * organisation's UUID bound to its `organisationId` variable, and the returned
 * id is persisted on the organisation row before being returned.
 *
 * Returns `null` when Brain env vars are not configured (local fail-soft).
 *
 * @throws if the organisation does not exist, or entity creation fails when Brain is configured.
 */
export async function ensureBrainEntityForOrganisation(
  organisationId: string
): Promise<string | null> {
  if (!isBrainConfigured()) {
    return null;
  }

  const [organisation] = await db
    .select({
      id: organisations.id,
      name: organisations.name,
      brainEntityId: organisations.brainEntityId,
    })
    .from(organisations)
    .where(eq(organisations.id, organisationId))
    .limit(1);

  if (!organisation) {
    throw new Error(`Organisation ${organisationId} not found.`);
  }

  if (organisation.brainEntityId) {
    return organisation.brainEntityId;
  }

  const entity = await createBrainEntity({
    entityTypeCode: ORGANISATION_ENTITY_TYPE_CODE,
    name: organisation.name,
    description: `Organisation ${organisation.id}`,
    variables: [{ key: "organisationId", value: organisation.id }],
  });

  await db
    .update(organisations)
    .set({ brainEntityId: entity.id })
    .where(eq(organisations.id, organisationId));

  return entity.id;
}
