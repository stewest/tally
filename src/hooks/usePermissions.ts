"use client";

import { useUser } from "@/context/UserContext";
import { hasRequiredRole, hasRoutePermission } from "@/utils/permissions";
import { usePathname } from "next/navigation";
import { Role } from "@db/schema";

export function usePermissions() {
  const { currentUser } = useUser();
  const pathname = usePathname();
  const userRole = currentUser?.role || null;

  return {
    hasRequiredRole: (role: Role) => hasRequiredRole(userRole, role),

    canAccessRoute: (route?: string) =>
      hasRoutePermission(userRole, route || pathname),
    canAccessCurrentRoute: () => hasRoutePermission(userRole, pathname),

    isAdmin: () =>
      userRole === Role.Admin || userRole === Role.SuperAdmin,
    isMember: () => userRole === Role.Member,
    isSuperAdmin: () => userRole === Role.SuperAdmin,

    userRole,
    currentUser,
  };
}
