import { eq } from "drizzle-orm";
import { db } from "../../db";
import { Profile, profiles } from "../../db/schema";
import { createOrganisation } from "./organisation";

export const LOCAL_DEV_CLERK_ID = "local-dev-user";
export const LOCAL_DEV_EMAIL = "local@localhost";
export const LOCAL_DEV_FIRST_NAME = "Local";
export const LOCAL_DEV_LAST_NAME = "Developer";
export const LOCAL_DEV_ORG_NAME = "Local";

const getProfileByClerkId = async (
  clerkId: string
): Promise<Profile | null> => {
  const result = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkId, clerkId))
    .limit(1);

  return result[0] ?? null;
};

const attachOrganisation = async (profile: Profile): Promise<Profile> => {
  if (profile.currentOrganisationId) {
    return profile;
  }

  const { organisation } = await createOrganisation(
    LOCAL_DEV_ORG_NAME,
    profile.id
  );

  const [updated] = await db
    .update(profiles)
    .set({ currentOrganisationId: organisation.id })
    .where(eq(profiles.id, profile.id))
    .returning();

  return updated ?? { ...profile, currentOrganisationId: organisation.id };
};

/**
 * Ensures a seeded local profile and organisation exist for Clerk-less `next dev`.
 */
export const ensureLocalDevProfile = async (): Promise<Profile> => {
  const existing = await getProfileByClerkId(LOCAL_DEV_CLERK_ID);
  if (existing) {
    return attachOrganisation(existing);
  }

  try {
    const [created] = await db
      .insert(profiles)
      .values({
        id: crypto.randomUUID(),
        clerkId: LOCAL_DEV_CLERK_ID,
        firstName: LOCAL_DEV_FIRST_NAME,
        lastName: LOCAL_DEV_LAST_NAME,
        email: LOCAL_DEV_EMAIL,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create local development profile");
    }

    return attachOrganisation(created);
  } catch {
    const raced = await getProfileByClerkId(LOCAL_DEV_CLERK_ID);
    if (raced) {
      return attachOrganisation(raced);
    }
    throw new Error("Failed to seed local development profile");
  }
};
