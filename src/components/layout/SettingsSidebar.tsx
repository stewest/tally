"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../ui/Icon";
import { useState } from "react";
import { getSettingsLinks } from "@/config/navigation";
import { useUser } from "@/context/UserContext";
import { hasRequiredRole } from "@/utils/permissions";

export default function SettingSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { userRole } = useUser();

  const settingsLinks = getSettingsLinks().filter(
    link => !link.requiredRole || hasRequiredRole(userRole, link.requiredRole)
  );

  const isActive = (path: string) => {
    if (pathname === path) return true;
    if (path !== "/organisation-settings" && pathname?.startsWith(`${path}/`)) {
      return true;
    }
    return false;
  };

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
            TALLY
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

      <div
        className={`border-b border-gray-200 flex items-center ${
          collapsed ? "justify-center px-3" : "px-4"
        }`}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-gray-700 hover:text-gray-900 py-3 text-sm font-medium transition-colors"
        >
          <Icon icon="arrowLeft" className="w-4 h-4" />
          {!collapsed && <span>Dashboard</span>}
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0">
          {settingsLinks.map(link => (
            <li key={link.path}>
              <Link
                href={link.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                  isActive(link.path)
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
                title={collapsed ? link.label : undefined}
              >
                <Icon
                  icon={link.icon}
                  className={`w-5 h-5 shrink-0 ${
                    isActive(link.path) ? "text-gray-900" : "text-gray-500"
                  }`}
                />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
