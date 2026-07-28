"use client";

import { useUser } from "@/context/UserContext";
import { hasRoutePermission } from "@/utils/permissions";
import { usePathname } from "next/navigation";
import ForbiddenPage from "../status-pages/ForbiddenPage";
import { PageSpinner } from "../Spinner";

interface RouteProtectionProps {
  children: React.ReactNode;
}

export function RouteProtection({ children }: RouteProtectionProps) {
  const { currentUser, isLoading } = useUser();
  const pathname = usePathname();

  if (isLoading) {
    return <PageSpinner />;
  }

  if (currentUser && !hasRoutePermission(currentUser.role, pathname)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
