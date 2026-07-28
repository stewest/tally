"use client";

import { useMemo } from "react";
import Tag from "@/components/ui/Tag";
import { useUser } from "@/context/UserContext";
import { usePageLayout } from "@/hooks/usePageLayout";
import BaseCard from "@/components/ui/BaseCard";

export default function DashboardPage() {
  const { currentUser } = useUser();

  usePageLayout(useMemo(() => ({ breadcrumbs: [{ label: "Dashboard" }] }), []));

  return (
    <div className="p-6 space-y-6">
      <BaseCard>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Your Dashboard
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Hello, {currentUser?.profile.firstName || "User"}!
        </p>
        <p className="text-gray-500">You are logged in as a </p>
        <Tag variant={currentUser?.role || "member"} />
      </BaseCard>
    </div>
  );
}
