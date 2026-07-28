import { NextResponse } from "next/server";
import { Role, Organisation } from "../../db/schema";
import { getCurrentUser, CurrentUser } from "@/server/authentication";
import { hasRequiredRole } from "@/utils/permissions";

export type AuthorisedUser = Omit<CurrentUser, "organisation"> & {
  organisation: Organisation;
};

type RequireRoleResult =
  | { user: AuthorisedUser; error: null }
  | { user: null; error: NextResponse };

/**
 * Authenticates the current user and enforces a minimum role.
 *
 * Usage:
 *   const { user, error } = await requireRole(Role.Admin);
 *   if (error) return error;
 *   user.organisation.id // guaranteed
 */
export async function requireRole(
  role: Role
): Promise<RequireRoleResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (!currentUser.organisation) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: "No organisation selected" },
        { status: 400 }
      ),
    };
  }

  if (!hasRequiredRole(currentUser.role, role)) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { user: currentUser as AuthorisedUser, error: null };
}
