"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Transaction } from "@db/schema";
import Modal from "@/components/Modal";
import Button from "@/components/buttons/Button";
import TransactionForm from "@/components/finance/TransactionForm";
import { Icon } from "@/components/ui/Icon";
import RowActionMenu from "@/components/ui/RowActionMenu";
import Table from "@/components/ui/Table";
import { usePageLayout } from "@/hooks/usePageLayout";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from "@/hooks/useTransactions";
import { TRANSACTION_CATEGORIES } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";
import type { TransactionFormValues } from "@/app/types/form-validation";

export default function TransactionsPage() {
  usePageLayout(useMemo(() => ({ breadcrumbs: [{ label: "Transactions" }] }), []));

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filters = useMemo(
    () => ({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      category: category || undefined,
      search: search || undefined,
    }),
    [fromDate, toDate, category, search]
  );

  const { data: transactions = [], isLoading } = useTransactions(filters);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "occurredAt",
        header: "Date",
        cell: ({ getValue }) => (
          <span className="text-gray-800">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.description}</p>
            {row.original.merchant && (
              <p className="text-xs text-gray-500">{row.original.merchant}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return (
            <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
              {value || "Uncategorised"}
            </span>
          );
        },
      },
      {
        accessorKey: "account",
        header: "Account",
        cell: ({ getValue }) => (
          <span className="text-gray-600">{getValue<string | null>() || "—"}</span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
          const amount = Number.parseFloat(row.original.amount);
          const isSpend = amount < 0;
          return (
            <span
              className={`font-medium ${
                isSpend ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {formatCurrency(row.original.amount, row.original.currency)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActionMenu
            items={[
              {
                icon: "pencil",
                label: "Edit",
                onClick: () => setEditing(row.original),
              },
              {
                icon: "trash",
                label: "Delete",
                destructive: true,
                onClick: () => {
                  void deleteTransaction.mutateAsync(row.original.id);
                },
              },
            ]}
          />
        ),
      },
    ],
    [deleteTransaction]
  );

  const handleCreate = async (data: TransactionFormValues) => {
    await createTransaction.mutateAsync({
      occurredAt: data.occurredAt,
      description: data.description,
      amount: data.amount,
      merchant: data.merchant || null,
      category: data.category || null,
      account: data.account || null,
      notes: data.notes || null,
    });
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: TransactionFormValues) => {
    if (!editing) return;
    await updateTransaction.mutateAsync({
      id: editing.id,
      occurredAt: data.occurredAt,
      description: data.description,
      amount: data.amount,
      merchant: data.merchant || null,
      category: data.category || null,
      account: data.account || null,
      notes: data.notes || null,
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">
            Review imported and manual transactions for this organisation.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Icon icon="plus" className="mr-2 h-4 w-4" />
          Add transaction
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm text-gray-700">
          From
          <input
            type="date"
            value={fromDate}
            onChange={event => setFromDate(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </label>
        <label className="text-sm text-gray-700">
          To
          <input
            type="date"
            value={toDate}
            onChange={event => setToDate(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </label>
        <label className="text-sm text-gray-700">
          Category
          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
          >
            <option value="">All categories</option>
            {TRANSACTION_CATEGORIES.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Search
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Description or merchant"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </label>
      </div>

      <Table
        data={transactions}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No transactions yet. Paste a bank statement in chat or add one manually."
      />

      {isCreateOpen && (
        <Modal title="Add transaction" onClose={() => setIsCreateOpen(false)}>
          <TransactionForm
            onSubmit={data => {
              void handleCreate(data);
            }}
            onCancel={() => setIsCreateOpen(false)}
            isSubmitting={createTransaction.isPending}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit transaction" onClose={() => setEditing(null)}>
          <TransactionForm
            defaultValues={{
              occurredAt: editing.occurredAt,
              description: editing.description,
              amount: editing.amount,
              merchant: editing.merchant ?? "",
              category: editing.category ?? "",
              account: editing.account ?? "",
              notes: editing.notes ?? "",
            } satisfies TransactionFormValues}
            submitLabel="Update transaction"
            onSubmit={data => {
              void handleUpdate(data);
            }}
            onCancel={() => setEditing(null)}
            isSubmitting={updateTransaction.isPending}
          />
        </Modal>
      )}
    </div>
  );
}
