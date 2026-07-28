import { type IconType } from "@/components/ui/Icon";
import { type Role } from "@db/schema";

export interface NavLinkConfig {
  path: string;
  label: string;
  icon: IconType;
  showInNav: boolean;
  requiredRole?: Role;
  isSettingsLink?: boolean;
}

export const NAV_LINKS: NavLinkConfig[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: "home",
    showInNav: true,
  },
  {
    path: "/chat",
    label: "Chat",
    icon: "comment",
    showInNav: true,
  },
  {
    path: "/profile",
    label: "My Profile",
    icon: "user",
    showInNav: false,
  },
  {
    path: "/organisation-settings",
    label: "Organisation Settings",
    icon: "sliders",
    showInNav: false,
    isSettingsLink: true,
    requiredRole: "admin",
  },
  {
    path: "/organisation-settings/users",
    label: "User Management",
    icon: "users",
    showInNav: false,
    isSettingsLink: true,
    requiredRole: "admin",
  },
];

export const getNavigationLinks = (): NavLinkConfig[] =>
  NAV_LINKS.filter((link) => link.showInNav);

export const getSettingsLinks = (): NavLinkConfig[] =>
  NAV_LINKS.filter((link) => link.isSettingsLink);

export function getRouteRequiredRole(pathname: string): Role | undefined {
  let matchedLink: NavLinkConfig | undefined;
  let matchLength = 0;

  for (const link of NAV_LINKS) {
    if (
      pathname.startsWith(link.path) &&
      link.path.length > matchLength &&
      link.requiredRole
    ) {
      matchedLink = link;
      matchLength = link.path.length;
    }
  }

  return matchedLink?.requiredRole;
}
