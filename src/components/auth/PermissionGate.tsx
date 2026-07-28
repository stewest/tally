"use client";

import { useUser } from "@/context/UserContext";
import { hasRequiredRole } from "@/utils/permissions";
import { type Role } from "@db/schema";
import { ReactNode } from "react";

interface PermissionGateProps {
  children: ReactNode;
  requiredRole?: Role;
  check?: () => boolean;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export function PermissionGate({
  children,
  requiredRole,
  check,
  fallback,
  showAccessDenied = false,
}: PermissionGateProps) {
  const { userRole } = useUser();

  let hasAccess = false;

  if (check) {
    hasAccess = check();
  } else if (requiredRole) {
    hasAccess = hasRequiredRole(userRole, requiredRole);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAccessDenied) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Access Denied
            </h3>
            <p className="text-gray-600 text-sm">
              You don&apos;t have permission to view this content.
            </p>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
