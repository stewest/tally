"use server";

import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import {
  inviteTokens,
  memberships,
  profiles,
  organisations,
} from "../../db/schema";
import { getClerkUserId, getProfileByClerkId, getCurrentUser } from "./authentication";
import crypto from "crypto";
import { Role } from "../../db/schema";
import { emailService } from "./emails";

const getAuthenticatedProfile = async () => {
  const clerkId = await getClerkUserId();
  const profile = await getProfileByClerkId(clerkId);

  if (!profile) {
    throw new Error("User profile not found");
  }

  return profile;
};

export interface InviteUserParams {
  email: string;
  role: Role;
  organisationId: string;
}

export const inviteUser = async ({
  email,
  role,
  organisationId,
}: InviteUserParams) => {
  const profile = await getAuthenticatedProfile();

  const existingInvite = await db
    .select()
    .from(inviteTokens)
    .where(
      and(
        eq(inviteTokens.email, email),
        eq(inviteTokens.organisationId, organisationId),
        eq(inviteTokens.status, "pending")
      )
    )
    .limit(1);

  if (existingInvite.length > 0) {
    throw new Error("User already has a pending invitation");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const [invite] = await db
    .insert(inviteTokens)
    .values({
      id: crypto.randomUUID(),
      email,
      organisationId,
      invitedByUserId: profile.id,
      role,
      token,
      status: "pending",
      expiresAt,
    })
    .returning();

  const [organisation, inviterProfile] = await Promise.all([
    db
      .select()
      .from(organisations)
      .where(eq(organisations.id, organisationId))
      .limit(1),
    db.select().from(profiles).where(eq(profiles.id, profile.id)).limit(1),
  ]);

  const organisationName = organisation[0]?.name || "the organization";
  const inviterName = inviterProfile[0]
    ? `${inviterProfile[0].firstName || ""} ${
        inviterProfile[0].lastName || ""
      }`.trim() || "The team"
    : "The team";

  try {
    await emailService.inviteUser({
      email,
      token,
      organisationName,
      inviterName,
    });
  } catch (error) {
    await db.delete(inviteTokens).where(eq(inviteTokens.id, invite.id));
    throw new Error(
      `Failed to send invitation email: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  return invite;
};

export const getInvitesForOrganisation = async (organisationId: string) => {
  const invites = await db
    .select({
      invite: inviteTokens,
      invitedBy: profiles,
      organisation: organisations,
    })
    .from(inviteTokens)
    .innerJoin(profiles, eq(inviteTokens.invitedByUserId, profiles.id))
    .innerJoin(organisations, eq(inviteTokens.organisationId, organisations.id))
    .where(
      and(
        eq(inviteTokens.organisationId, organisationId),
        eq(inviteTokens.status, "pending")
      )
    );

  return invites;
};

export const getInviteByToken = async (token: string) => {
  const invite = await db
    .select({
      invite: inviteTokens,
      organisation: organisations,
    })
    .from(inviteTokens)
    .innerJoin(organisations, eq(inviteTokens.organisationId, organisations.id))
    .where(
      and(eq(inviteTokens.token, token), eq(inviteTokens.status, "pending"))
    )
    .limit(1);

  return invite[0] || null;
};

export const acceptInvite = async (token: string, userId: string) => {
  const invite = await getInviteByToken(token);

  if (!invite) {
    throw new Error("Invalid or expired invitation");
  }

  if (new Date() > invite.invite.expiresAt) {
    throw new Error("Invitation has expired");
  }

  const existingMembership = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organisationId, invite.invite.organisationId)
      )
    )
    .limit(1);

  if (existingMembership.length > 0) {
    await db
      .update(inviteTokens)
      .set({
        status: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(inviteTokens.id, invite.invite.id));

    return existingMembership[0];
  }

  const [membership] = await db
    .insert(memberships)
    .values({
      id: crypto.randomUUID(),
      userId,
      organisationId: invite.invite.organisationId,
      role: invite.invite.role,
    })
    .returning();

  await Promise.all([
    db
      .update(profiles)
      .set({
        currentOrganisationId: invite.invite.organisationId,
      })
      .where(eq(profiles.id, userId)),
    db
      .update(inviteTokens)
      .set({
        status: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(inviteTokens.id, invite.invite.id)),
  ]);

  return membership;
};

export const cancelInvite = async (inviteId: string) => {
  const user = await getCurrentUser();
  const orgId = user?.organisation?.id ?? "";

  await db
    .update(inviteTokens)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(and(eq(inviteTokens.id, inviteId), eq(inviteTokens.organisationId, orgId)));

  return { success: true };
};

export const resendInvite = async (inviteId: string) => {
  const user = await getCurrentUser();
  const orgId = user?.organisation?.id ?? "";

  const invite = await db
    .select()
    .from(inviteTokens)
    .where(and(eq(inviteTokens.id, inviteId), eq(inviteTokens.organisationId, orgId)))
    .limit(1);

  if (!invite.length) {
    throw new Error("Invite not found");
  }

  const inviteData = invite[0];

  const newToken = crypto.randomBytes(32).toString("hex");
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  await db
    .update(inviteTokens)
    .set({
      token: newToken,
      expiresAt: newExpiresAt,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(and(eq(inviteTokens.id, inviteId), eq(inviteTokens.organisationId, orgId)));

  const organisation = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, inviteData.organisationId))
    .limit(1);

  const organisationName = organisation[0]?.name || "the organization";

  try {
    await emailService.inviteUser({
      name: inviteData.email.split("@")[0],
      email: inviteData.email,
      token: newToken,
      organisationName,
    });
  } catch (error) {
    throw new Error(
      `Failed to resend invitation email: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  return { success: true };
};

export const updateUserRole = async (membershipId: string, newRole: Role) => {
  const user = await getCurrentUser();
  const orgId = user?.organisation?.id;

  if (!orgId) {
    throw new Error("No active organisation");
  }

  const currentUserMembership = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, user.profile.id), eq(memberships.organisationId, orgId)))
    .limit(1);

  if (
    !currentUserMembership.length ||
    currentUserMembership[0].role !== "admin"
  ) {
    throw new Error("Only admins can update user roles");
  }

  const targetMembership = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.organisationId, orgId)))
    .limit(1);

  if (!targetMembership.length) {
    throw new Error("Membership not found");
  }

  if (targetMembership[0].userId === user.profile.id && newRole !== "admin") {
    throw new Error("Cannot remove your own admin privileges");
  }

  const [updatedMembership] = await db
    .update(memberships)
    .set({
      role: newRole,
      updatedAt: new Date(),
    })
    .where(eq(memberships.id, membershipId))
    .returning();

  return updatedMembership;
};

export const removeUser = async (membershipId: string) => {
  const user = await getCurrentUser();
  const orgId = user?.organisation?.id;

  if (!orgId) {
    throw new Error("No active organisation");
  }

  const currentUserMembership = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, user.profile.id), eq(memberships.organisationId, orgId)))
    .limit(1);

  if (
    !currentUserMembership.length ||
    currentUserMembership[0].role !== "admin"
  ) {
    throw new Error("Only admins can remove users");
  }

  const targetMembership = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.organisationId, orgId)))
    .limit(1);

  if (!targetMembership.length) {
    throw new Error("Membership not found");
  }

  if (targetMembership[0].userId === user.profile.id) {
    throw new Error("Cannot remove yourself from the organization");
  }

  await db.delete(memberships).where(eq(memberships.id, membershipId));

  await db
    .update(profiles)
    .set({ currentOrganisationId: null })
    .where(
      and(
        eq(profiles.id, targetMembership[0].userId),
        eq(profiles.currentOrganisationId, targetMembership[0].organisationId)
      )
    );

  return { success: true };
};

export const getUserMemberships = async (userId: string) => {
  const userMemberships = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId));

  return userMemberships;
};

export interface UpdateUserCommissionParams {
  membershipId: string;
  saleCommission?: number | null;
  printAndInstallCommission?: number | null;
}
