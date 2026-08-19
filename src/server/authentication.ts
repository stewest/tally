"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import {
  Profile,
  Organisation,
  Role,
  Membership,
  profiles,
} from "../../db/schema";
import { getMembership, getUserMemberships } from "./membership";
import { getOrganisation } from "./organisation";
import { isLocalAuthBypassEnabled } from "@/utils/auth-mode";
import { ensureLocalDevProfile, LOCAL_DEV_CLERK_ID } from "./local-auth";

export type CurrentUser = {
  profile: Profile;
  organisation: Organisation | null;
  role: Role | null;
  memberships: Membership[];
};

export const getClerkUserId = async (): Promise<string> => {
  if (isLocalAuthBypassEnabled()) {
    await ensureLocalDevProfile();
    return LOCAL_DEV_CLERK_ID;
  }

  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");
  return userId;
};

export const getProfileByClerkId = async (
  clerkId: string
): Promise<Profile | null> => {
  const result = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkId, clerkId))
    .limit(1);

  return result[0] ?? null;
};

const getOrCreateProfile = async (clerkId: string): Promise<Profile | null> => {
  if (isLocalAuthBypassEnabled()) {
    return ensureLocalDevProfile();
  }

  const existing = await getProfileByClerkId(clerkId);
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const primaryEmail =
    clerkUser.emailAddresses?.[0]?.emailAddress ?? null;

  // Check if a profile already exists with this email (pre-invited user)
  if (primaryEmail) {
    const emailMatch = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, primaryEmail))
      .limit(1);

    if (emailMatch[0]) {
      await db
        .update(profiles)
        .set({ clerkId })
        .where(eq(profiles.id, emailMatch[0].id));

      return { ...emailMatch[0], clerkId };
    }
  }

  const [newProfile] = await db
    .insert(profiles)
    .values({
      id: crypto.randomUUID(),
      clerkId,
      firstName: clerkUser.firstName ?? null,
      lastName: clerkUser.lastName ?? null,
      email: primaryEmail,
    })
    .returning();

  return newProfile ?? null;
};

const buildCurrentUser = async (profile: Profile): Promise<CurrentUser> => {
  let role: Role | null = null;
  let organisation: Organisation | null = null;
  let memberships: Membership[] = [];
  if (profile.currentOrganisationId) {
    const membership = await getMembership(
      profile.id,
      profile.currentOrganisationId
    );

    if (membership) {
      organisation = await getOrganisation(membership.organisationId);
      role = membership.role as Role;
    }
  }

  if (profile.id) {
    memberships = await getUserMemberships(profile.id);
  }

  return {
    profile,
    organisation,
    role,
    memberships,
  };
};

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  if (isLocalAuthBypassEnabled()) {
    const profile = await ensureLocalDevProfile();
    return buildCurrentUser(profile);
  }

  const clerkId = await getClerkUserId();
  const profile = await getOrCreateProfile(clerkId);

  if (!profile) {
    return null;
  }

  return buildCurrentUser(profile);
};
