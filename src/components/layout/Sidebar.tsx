"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../ui/Icon";
import { useState } from "react";
import { getNavigationLinks } from "@/config/navigation";
import { useUser } from "@/context/UserContext";
import { hasRequiredRole } from "@/utils/permissions";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { userRole } = useUser();

  const isActive = (path: string) =>
    pathname === path ||
    (path !== "/dashboard" && pathname?.startsWith(path + "/"));

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } h-screen flex flex-col border-r border-gray-200 bg-white transition-all duration-200`}
    >
      <div className="flex items-center justify-between px-4 py-5">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-gray-900 tracking-tight"
          >
            App
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon icon="bars" className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-1 overflow-y-auto">
        <ul className="space-y-0">
          {getNavigationLinks()
            .filter(
              (link) =>
                !link.requiredRole ||
                hasRequiredRole(userRole, link.requiredRole)
            )
            .map((navLink) => (
              <li key={navLink.path}>
                <Link
                  href={navLink.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                    isActive(navLink.path)
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={collapsed ? navLink.label : undefined}
                >
                  {navLink.icon && (
                    <Icon
                      icon={navLink.icon}
                      className={`w-5 h-5 shrink-0 ${
                        isActive(navLink.path)
                          ? "text-gray-900"
                          : "text-gray-500"
                      }`}
                    />
                  )}
                  {!collapsed && <span>{navLink.label}</span>}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  );
}
