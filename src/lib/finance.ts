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
  "Giving",
  "Health",
  "Insurance",
  "Savings",
  "Income",
  "Transfer",
  "Other",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

/** Retired labels that must roll up into one dropdown category. */
export const CATEGORY_ALIASES: Record<string, TransactionCategory> = {
  "Giving & Donations": "Giving",
  Donations: "Giving",
  "Dining & Drinks": "Dining",
};

export function canonicaliseCategory(
  value: string | null | undefined
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const needle = trimmed.toLowerCase();
  const alias = Object.entries(CATEGORY_ALIASES).find(
    ([name]) => name.toLowerCase() === needle
  );
  return alias ? alias[1] : trimmed;
}

/** Stored labels that belong to the same category, including retired names. */
export function categoryLookupValues(category: string): string[] {
  const trimmed = category.trim();
  const canonical = canonicaliseCategory(trimmed) ?? trimmed;
  const aliases = Object.entries(CATEGORY_ALIASES)
    .filter(([, target]) => target === canonical)
    .map(([alias]) => alias);
  return [...new Set([canonical, trimmed, ...aliases].filter(name => name.length > 0))];
}

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
    const category = canonicaliseCategory(row.category) ?? "Uncategorised";
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

export function uniqueSortedCategories(
  values: Iterable<string | null | undefined>
): string[] {
  const names = new Set<string>();
  for (const value of values) {
    const canonical = canonicaliseCategory(value);
    if (canonical) names.add(canonical);
  }
  return [...names].sort((left, right) => left.localeCompare(right, "en"));
}

/** Category names from a Brain Category Taxonomy markdown table. */
export function parseCategoryTaxonomyTable(markdown: string): string[] {
  const names: string[] = [];
  for (const line of markdown.split("\n")) {
    const match = line.match(/^\|\s*([^|]+?)\s*\|/);
    if (!match) continue;
    const name = match[1].trim();
    if (
      !name ||
      name.toLowerCase() === "category" ||
      /^[-:]+$/.test(name.replace(/\s/g, ""))
    ) {
      continue;
    }
    names.push(name);
  }
  return uniqueSortedCategories(names);
}

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
