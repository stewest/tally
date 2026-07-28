"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import SettingSidebar from "@/components/layout/SettingsSidebar";
import { AuthenticationCheck } from "./AuthenticationCheck";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettingSidebar = pathname?.startsWith("/organisation-settings");
  const isDashboard = pathname === "/dashboard";
  const isChat = pathname === "/chat";
  const mainPadding = isDashboard ? "" : isChat ? "p-6 min-h-0" : "p-6";

  return (
    <AuthenticationCheck>
      <RouteProtection>
        <div className="h-screen flex overflow-hidden">
          {isSettingSidebar ? <SettingSidebar /> : <Sidebar />}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main
              className={`flex-1 overflow-auto bg-gray-50 ${mainPadding} ${
                isChat ? "flex flex-col" : ""
              }`}
            >
              {children}
            </main>
          </div>
        </div>
      </RouteProtection>
    </AuthenticationCheck>
  );
}
