import {
  pgTable,
  text,
  uuid,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

const rolesEnum = pgEnum("roles", ["admin", "member", "super_admin"]);

const inviteStatusEnum = pgEnum("invite_statuses", [
  "pending",
  "accepted",
  "expired",
]);

// Export the enum objects
export { inviteStatusEnum, rolesEnum };

// Create convenient enum-like objects for dot notation access
export const InviteStatus = {
  Pending: "pending" as const,
  Accepted: "accepted" as const,
  Expired: "expired" as const,
} as const;

export const Role = {
  Admin: "admin" as const,
  Member: "member" as const,
  SuperAdmin: "super_admin" as const,
} as const;

export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  brainEntityId: uuid("brain_entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  currentOrganisationId: uuid("current_organisation_id").references(
    () => organisations.id
  ),
  profileImageId: uuid("profile_image_id").references(() => files.id),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  role: rolesEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  storagePath: text("storage_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inviteTokens = pgTable("invite_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  invitedByUserId: uuid("invited_by_user_id")
    .notNull()
    .references(() => profiles.id),
  role: rolesEnum("role").notNull().default("member"),
  token: text("token").notNull().unique(),
  status: inviteStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Essential type exports
export type Profile = typeof profiles.$inferSelect;
export type Organisation = typeof organisations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Role = (typeof rolesEnum.enumValues)[number];
export type InviteStatus = (typeof inviteStatusEnum.enumValues)[number];
export type File = typeof files.$inferSelect;
export type InviteToken = typeof inviteTokens.$inferSelect;
// Type for joined data with related entities
export type MembershipWithUser = {
  membership: Membership;
  profile: Profile;
};

export type InviteWithDetails = {
  invite: InviteToken;
  invitedBy: Profile;
};
