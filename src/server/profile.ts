"use server";

import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { profiles, memberships } from "../../db/schema";
import { getClerkUserId, getProfileByClerkId } from "./authentication";

export const getUserProfile = async () => {
  const clerkId = await getClerkUserId();
  return getProfileByClerkId(clerkId);
};

export const getUserProfilesForOrganisation = async (
  organisationId: string
) => {
  const userProfiles = await db
    .select({
      profile: profiles,
      membership: memberships,
    })
    .from(profiles)
    .innerJoin(memberships, eq(profiles.id, memberships.userId))
    .where(eq(memberships.organisationId, organisationId));

  return userProfiles.sort((a, b) => {
    const aName = `${a.profile.firstName} ${a.profile.lastName}`;
    const bName = `${b.profile.firstName} ${b.profile.lastName}`;
    return aName.localeCompare(bName);
  });
};

export const setProfileCurrentOrganisation = async (
  organisationId: string | null
) => {
  const clerkId = await getClerkUserId();
  const profile = await getProfileByClerkId(clerkId);

  if (!profile) {
    throw new Error("User profile not found");
  }

  if (organisationId) {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, profile.id), eq(memberships.organisationId, organisationId)))
      .limit(1);

    if (!membership) {
      throw new Error("Not a member of this organisation");
    }
  }

  await db
    .update(profiles)
    .set({ currentOrganisationId: organisationId })
    .where(eq(profiles.id, profile.id));
};

export interface UpdateProfileParams {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const updateProfile = async (params: UpdateProfileParams) => {
  const clerkId = await getClerkUserId();
  const profile = await getProfileByClerkId(clerkId);

  if (!profile) {
    throw new Error("User profile not found");
  }

  try {
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
      })
      .where(eq(profiles.id, profile.id))
      .returning();

    return { profile: updatedProfile, error: null };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { profile: null, error: "Failed to update profile" };
  }
};

export const updateProfilePicture = async (fileId: string) => {
  const clerkId = await getClerkUserId();
  const profile = await getProfileByClerkId(clerkId);

  if (!profile) {
    throw new Error("User profile not found");
  }

  try {
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        profileImageId: fileId,
      })
      .where(eq(profiles.id, profile.id))
      .returning();

    return { profile: updatedProfile, error: null };
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return { profile: null, error: "Failed to update profile picture" };
  }
};
