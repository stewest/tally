import type { Budget, BudgetPeriod } from "@db/schema";

export interface CategorySpendRow {
  category: string;
  total: string;
  count: number;
}

export interface BudgetProgress extends Budget {
  periodStart: string;
  periodEnd: string;
  spent: string;
  remaining: string;
  percentUsed: number;
}

export const TRANSACTION_CATEGORIES = [
  "Housing",
  "Groceries",
  "Transport",
  "Utilities",
  "Entertainment",
  "Dining",
  "Health",
  "Insurance",
  "Savings",
  "Income",
  "Transfer",
  "Other",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const BUDGET_PERIODS: BudgetPeriod[] = [
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "yearly",
];

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export function groupBudgetsByCategory<
  T extends { category: string; period: BudgetPeriod; startsOn: string },
>(rows: readonly T[]): { category: string; budgets: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const category = row.category.trim() || "Uncategorised";
    const list = groups.get(category) ?? [];
    list.push(row);
    groups.set(category, list);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "en"))
    .map(([category, items]) => ({
      category,
      budgets: [...items].sort((left, right) => {
        const periodDiff =
          BUDGET_PERIODS.indexOf(left.period) - BUDGET_PERIODS.indexOf(right.period);
        if (periodDiff !== 0) return periodDiff;
        return left.startsOn.localeCompare(right.startsOn);
      }),
    }));
}

export const DEFAULT_CURRENCY = "NZD";

export function isTransactionCategory(
  value: string
): value is TransactionCategory {
  return (TRANSACTION_CATEGORIES as readonly string[]).includes(value);
}

export function isBudgetPeriod(value: string): value is BudgetPeriod {
  return (BUDGET_PERIODS as readonly string[]).includes(value);
}

export function computeDedupeKey(
  occurredAt: string,
  amount: string,
  description: string
): string {
  const normalised = description.trim().toLowerCase().replace(/\s+/g, " ");
  return `${occurredAt}|${amount}|${normalised}`;
}

export function normaliseMoneyAmount(value: string | number): string {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Amount must be a valid number.");
  }
  return parsed.toFixed(2);
}
