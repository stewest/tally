"use client";

import { useMemo } from "react";
import Link from "next/link";
import Tag from "@/components/ui/Tag";
import { useUser } from "@/context/UserContext";
import { usePageLayout } from "@/hooks/usePageLayout";
import { useFinanceSummary } from "@/hooks/useFinanceSummary";
import BaseCard from "@/components/ui/BaseCard";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { currentUser } = useUser();
  const summary = useFinanceSummary();

  usePageLayout(useMemo(() => ({ breadcrumbs: [{ label: "Dashboard" }] }), []));

  const categories = summary.data?.byCategory ?? [];
  const alerts = (summary.data?.budgets ?? []).filter(
    budget => budget.percentUsed >= 80
  );

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

      <div className="grid gap-6 lg:grid-cols-2">
        <BaseCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Spend by category
            </h2>
            <Link
              href="/transactions"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View transactions
            </Link>
          </div>
          {summary.isLoading && (
            <p className="text-sm text-gray-500">Loading summary…</p>
          )}
          {!summary.isLoading && categories.length === 0 && (
            <p className="text-sm text-gray-500">
              No transactions yet. Paste a bank statement in chat to get started.
            </p>
          )}
          <ul className="space-y-2">
            {categories.map(row => (
              <li
                key={row.category}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">
                  {row.category}
                  <span className="ml-2 text-gray-400">({row.count})</span>
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(row.total)}
                </span>
              </li>
            ))}
          </ul>
        </BaseCard>

        <BaseCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Budget alerts
            </h2>
            <Link
              href="/budgets"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Manage budgets
            </Link>
          </div>
          {summary.isLoading && (
            <p className="text-sm text-gray-500">Loading budgets…</p>
          )}
          {!summary.isLoading && alerts.length === 0 && (
            <p className="text-sm text-gray-500">
              No budgets are near their limit.
            </p>
          )}
          <ul className="space-y-3">
            {alerts.map(budget => (
              <li key={`${budget.category}-${budget.startsOn}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">
                    {budget.category}
                  </span>
                  <span
                    className={
                      budget.percentUsed >= 100
                        ? "text-red-600"
                        : "text-amber-600"
                    }
                  >
                    {budget.percentUsed}% used
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      budget.percentUsed >= 100 ? "bg-red-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </BaseCard>
      </div>
    </div>
  );
}
