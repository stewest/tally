"use server";

import { db } from "../../db";
import { organisations } from "../../db/schema";
import { eq, inArray } from "drizzle-orm";
import { memberships } from "../../db/schema";
import { getUserMemberships } from "./membership";
import { createAdminClient } from "@/utils/supabase/server";
import { ensureBrainEntityForOrganisation } from "@/server/brain/entities";

export const getOrganisation = async (organisationId: string) => {
  const organisation = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, organisationId))
    .limit(1);

  return organisation[0];
};

export const getMemberOrganisations = async (userId: string) => {
  try {
    const memberships = await getUserMemberships(userId);

    const organisationIds = memberships.map(
      membership => membership.organisationId
    );
    const memberOrganisations = await db
      .select()
      .from(organisations)
      .where(inArray(organisations.id, organisationIds));

    return { organisations: memberOrganisations, error: null };
  } catch (error) {
    console.error("Error fetching member organisations:", error);
    return { organisations: [], error: "Failed to fetch member organisations" };
  }
};

export const createOrganisation = async (name: string, userId: string) => {
  const [organisation] = await db
    .insert(organisations)
    .values({
      id: crypto.randomUUID(),
      name,
    })
    .returning();

  const [membership] = await db
    .insert(memberships)
    .values({
      id: crypto.randomUUID(),
      userId,
      organisationId: organisation.id,
      role: "admin",
    })
    .returning();

  await createBucket(organisation.id);

  // Fail-soft: entity mapping is skipped when BRAIN_* env is unset (local dev).
  try {
    await ensureBrainEntityForOrganisation(organisation.id);
  } catch (error) {
    console.error(
      "Failed to create Telos Brain entity for organisation:",
      error
    );
  }

  return { organisation, membership };
};

export const updateOrganisation = async (
  organisationId: string,
  name: string
) => {
  try {
    const [organisation] = await db
      .update(organisations)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(organisations.id, organisationId))
      .returning();

    return { organisation, error: null };
  } catch (error) {
    console.error("Error updating organisation:", error);
    return { organisation: null, error: "Failed to update organisation" };
  }
};

const createBucket = async (organisationId: string) => {
  const supabase = createAdminClient();

  // Create the bucket (requires secret key — bypasses RLS)
  try {
    console.log("Creating bucket", organisationId);
    const { data: bucketData, error: bucketError } =
      await supabase.storage.createBucket(organisationId);
    if (bucketError) {
      console.error("Error creating bucket:", bucketError);
    } else {
      console.log("Bucket created successfully:", organisationId);
    }
  } catch (error) {
    console.error("Exception while creating bucket:", error);
  }
};
