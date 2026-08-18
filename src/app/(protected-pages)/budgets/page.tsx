"use client";

import { useMemo, useState } from "react";
import type { Budget } from "@db/schema";
import Modal from "@/components/Modal";
import Button from "@/components/buttons/Button";
import BudgetForm from "@/components/finance/BudgetForm";
import BaseCard from "@/components/ui/BaseCard";
import { Icon } from "@/components/ui/Icon";
import { usePageLayout } from "@/hooks/usePageLayout";
import { useDeleteBudget, useUpdateBudget, useUpsertBudget } from "@/hooks/useBudgets";
import { useFinanceSummary } from "@/hooks/useFinanceSummary";
import { formatCurrency } from "@/lib/utils";
import type { BudgetFormValues } from "@/app/types/form-validation";
import type { BudgetPeriod } from "@db/schema";

export default function BudgetsPage() {
  usePageLayout(useMemo(() => ({ breadcrumbs: [{ label: "Budgets" }] }), []));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  const summary = useFinanceSummary();
  const upsertBudget = useUpsertBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const budgets = summary.data?.budgets ?? [];

  const handleCreate = async (data: BudgetFormValues) => {
    try {
      await upsertBudget.mutateAsync({
        category: data.category,
        period: data.period as BudgetPeriod,
        amount: data.amount,
        startsOn: data.startsOn,
        endsOn: data.endsOn || null,
        notes: data.notes || null,
      });
      setIsCreateOpen(false);
    } catch {
      // Toast is handled by the mutation
    }
  };

  const handleUpdate = async (data: BudgetFormValues) => {
    if (!editing) return;
    await updateBudget.mutateAsync({
      id: editing.id,
      category: data.category,
      period: data.period as BudgetPeriod,
      amount: data.amount,
      startsOn: data.startsOn,
      endsOn: data.endsOn || null,
      notes: data.notes || null,
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600">
            Set category limits and compare them with current-period spend.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Icon icon="plus" className="mr-2 h-4 w-4" />
          Add budget
        </Button>
      </div>

      {summary.isLoading && (
        <p className="text-sm text-gray-500">Loading budgets…</p>
      )}

      {!summary.isLoading && budgets.length === 0 && (
        <BaseCard>
          <p className="text-gray-600">
            No budgets yet. Create one here or ask chat to set a monthly limit.
          </p>
        </BaseCard>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map(budget => {
          const over = budget.percentUsed >= 100;
          const warning = budget.percentUsed >= 80 && !over;
          return (
            <BaseCard key={budget.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {budget.category}
                  </h2>
                  <p className="text-sm text-gray-500">
                    <span className="capitalize">{budget.period}</span>
                    {" · "}
                    {budget.startsOn}
                    {budget.endsOn ? ` to ${budget.endsOn}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    onClick={() => setEditing(budget)}
                    title="Edit"
                  >
                    <Icon icon="pencil" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      void deleteBudget.mutateAsync(budget.id);
                    }}
                    title="Delete"
                  >
                    <Icon icon="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {formatCurrency(budget.spent, budget.currency)} spent
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(budget.amount, budget.currency)}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                This period: {budget.periodStart} to {budget.periodEnd}
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${
                    over ? "bg-red-500" : warning ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                />
              </div>
              <p
                className={`text-sm ${
                  over
                    ? "text-red-600"
                    : warning
                      ? "text-amber-600"
                      : "text-gray-500"
                }`}
              >
                {budget.percentUsed}% used · {formatCurrency(budget.remaining, budget.currency)} remaining
              </p>
            </BaseCard>
          );
        })}
      </div>

      {isCreateOpen && (
        <Modal title="Add budget" onClose={() => setIsCreateOpen(false)}>
          <BudgetForm
            onSubmit={data => {
              void handleCreate(data);
            }}
            onCancel={() => setIsCreateOpen(false)}
            isSubmitting={upsertBudget.isPending}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit budget" onClose={() => setEditing(null)}>
          <BudgetForm
            defaultValues={{
              category: editing.category,
              period: editing.period,
              amount: editing.amount,
              startsOn: editing.startsOn,
              endsOn: editing.endsOn ?? "",
              notes: editing.notes ?? "",
            }}
            submitLabel="Update budget"
            onSubmit={data => {
              void handleUpdate(data);
            }}
            onCancel={() => setEditing(null)}
            isSubmitting={updateBudget.isPending}
          />
        </Modal>
      )}
    </div>
  );
}
