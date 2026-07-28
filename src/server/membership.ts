"use server";

import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { memberships } from "../../db/schema";

export const getMembership = async (userId: string, organisationId: string) => {
  const membership = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organisationId, organisationId)))
    .limit(1);

  return membership[0];
};

export const getUserMemberships = async (userId: string) => {
  const userMemberships = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId));

  return userMemberships;
};
