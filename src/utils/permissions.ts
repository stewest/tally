import { CurrentUser } from "@/server/authentication";
import { Role } from "../../db/schema";
import { getRouteRequiredRole } from "@/config/navigation";

const ROLE_HIERARCHY: Role[] = [Role.Member, Role.Admin, Role.SuperAdmin];

export function hasRequiredRole(
  userRole: Role | string | null | undefined,
  requiredRole: Role
): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY.indexOf(userRole as Role);
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
  return userLevel >= requiredLevel;
}

export function hasRoutePermission(
  userRole: Role | string | null,
  pathname: string
): boolean {
  if (!userRole) return false;

  const requiredRole = getRouteRequiredRole(pathname);
  if (!requiredRole) return true;

  return hasRequiredRole(userRole, requiredRole);
}

export function isSuperAdmin(user: CurrentUser | null): boolean {
  if (!user) return false;
  return hasRequiredRole(user.role, Role.SuperAdmin);
}

export function isAdmin(user: CurrentUser | null): boolean {
  if (!user) return false;
  return hasRequiredRole(user.role, Role.Admin);
}