import { withOrgContext, type DbTransaction } from "@db/index";
import {
  budgets,
  transactions,
  type Transaction,
  type TransactionSource,
} from "@db/schema";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  canonicaliseCategory,
  CATEGORY_ALIASES,
  categoryLookupValues,
  computeDedupeKey,
  DEFAULT_CURRENCY,
  normaliseMoneyAmount,
  parseCategoryTaxonomyTable,
  uniqueSortedCategories,
  type CategorySpendRow,
} from "@/lib/finance";
import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

export type { CategorySpendRow };

export interface ListTransactionsFilters {
  fromDate?: string;
  toDate?: string;
  category?: string;
  account?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateTransactionInput {
  occurredAt: string;
  description: string;
  amount: string | number;
  merchant?: string | null;
  category?: string | null;
  account?: string | null;
  notes?: string | null;
  currency?: string;
  source?: TransactionSource;
  importBatchId?: string | null;
  createdByUserId?: string | null;
}

export interface UpdateTransactionInput {
  occurredAt?: string;
  description?: string;
  amount?: string | number;
  merchant?: string | null;
  category?: string | null;
  account?: string | null;
  notes?: string | null;
  currency?: string;
}

export interface CreateTransactionsResult {
  inserted: Transaction[];
  skipped: number;
  importBatchId: string;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function canonicalCategorySql() {
  const column = transactions.category;
  const whens = Object.entries(CATEGORY_ALIASES).map(
    ([alias, canonical]) =>
      sql`when lower(${column}) = lower(${alias}) then ${canonical}`
  );
  return sql<string>`case ${sql.join(whens, sql` `)} else coalesce(${column}, 'Uncategorised') end`;
}

/** Fold retired category labels into the dropdown names. */
export async function mergeStoredCategoryAliases(
  tx: DbTransaction,
  organisationId: string
): Promise<void> {
  for (const [alias, canonical] of Object.entries(CATEGORY_ALIASES)) {
    await tx.execute(sql`
      delete from ${budgets} as alias_row
      where alias_row.organisation_id = ${organisationId}
        and lower(alias_row.category) = lower(${alias})
        and exists (
          select 1
          from ${budgets} as canonical_row
          where canonical_row.organisation_id = alias_row.organisation_id
            and lower(canonical_row.category) = lower(${canonical})
            and canonical_row.period = alias_row.period
            and canonical_row.starts_on = alias_row.starts_on
        )
    `);
    await tx
      .update(budgets)
      .set({ category: canonical, updatedAt: new Date() })
      .where(
        and(
          eq(budgets.organisationId, organisationId),
          sql`lower(${budgets.category}) = lower(${alias})`
        )
      );
    await tx
      .update(transactions)
      .set({ category: canonical, updatedAt: new Date() })
      .where(
        and(
          eq(transactions.organisationId, organisationId),
          sql`lower(${transactions.category}) = lower(${alias})`
        )
      );
  }
}

function withCanonicalCategory<T extends { category: string | null }>(row: T): T {
  return {
    ...row,
    category: canonicaliseCategory(row.category),
  };
}

export async function listTransactions(
  organisationId: string,
  filters: ListTransactionsFilters = {}
): Promise<Transaction[]> {
  const conditions = [eq(transactions.organisationId, organisationId)];

  if (filters.fromDate) {
    conditions.push(gte(transactions.occurredAt, filters.fromDate));
  }
  if (filters.toDate) {
    conditions.push(lte(transactions.occurredAt, filters.toDate));
  }
  if (filters.category) {
    conditions.push(
      inArray(transactions.category, categoryLookupValues(filters.category))
    );
  }
  if (filters.account) {
    conditions.push(eq(transactions.account, filters.account));
  }
  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(ilike(transactions.description, term), ilike(transactions.merchant, term))!
    );
  }

  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 500) : 500;
  const offset = filters.offset && filters.offset > 0 ? filters.offset : 0;

  return withOrgContext(organisationId, async tx => {
    await mergeStoredCategoryAliases(tx, organisationId);
    const rows = await tx
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
    return rows.map(withCanonicalCategory);
  });
}

export async function createTransactions(
  organisationId: string,
  inputs: CreateTransactionInput[]
): Promise<CreateTransactionsResult> {
  if (inputs.length === 0) {
    throw new Error("At least one transaction is required.");
  }

  const importBatchId = inputs[0]?.importBatchId ?? crypto.randomUUID();

  const rows = inputs.map(input => {
    if (!isIsoDate(input.occurredAt)) {
      throw new Error(`occurredAt must be YYYY-MM-DD (got "${input.occurredAt}").`);
    }
    const description = input.description.trim();
    if (!description) {
      throw new Error("description is required.");
    }
    const amount = normaliseMoneyAmount(input.amount);
    return {
      organisationId,
      occurredAt: input.occurredAt,
      description,
      merchant: input.merchant?.trim() || null,
      amount,
      currency: input.currency?.trim() || DEFAULT_CURRENCY,
      category: canonicaliseCategory(input.category),
      account: input.account?.trim() || null,
      source: input.source ?? "manual",
      notes: input.notes?.trim() || null,
      dedupeKey: computeDedupeKey(input.occurredAt, amount, description),
      importBatchId,
      createdByUserId: input.createdByUserId ?? null,
    };
  });

  return withOrgContext(organisationId, async tx => {
    const inserted = await tx
      .insert(transactions)
      .values(rows)
      .onConflictDoNothing({
        target: [transactions.organisationId, transactions.dedupeKey],
      })
      .returning();

    return {
      inserted,
      skipped: rows.length - inserted.length,
      importBatchId,
    };
  });
}

export async function updateTransaction(
  organisationId: string,
  transactionId: string,
  input: UpdateTransactionInput
): Promise<Transaction | null> {
  return withOrgContext(organisationId, async tx => {
    const [existing] = await tx
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!existing) {
      return null;
    }

    const occurredAt = input.occurredAt ?? existing.occurredAt;
    const description = input.description?.trim() ?? existing.description;
    const amount = input.amount !== undefined
      ? normaliseMoneyAmount(input.amount)
      : existing.amount;

    if (!isIsoDate(occurredAt)) {
      throw new Error(`occurredAt must be YYYY-MM-DD (got "${occurredAt}").`);
    }
    if (!description) {
      throw new Error("description is required.");
    }

    const [updated] = await tx
      .update(transactions)
      .set({
        occurredAt,
        description,
        amount,
        merchant:
          input.merchant !== undefined
            ? input.merchant?.trim() || null
            : existing.merchant,
        category:
          input.category !== undefined
            ? canonicaliseCategory(input.category)
            : canonicaliseCategory(existing.category),
        account:
          input.account !== undefined
            ? input.account?.trim() || null
            : existing.account,
        notes:
          input.notes !== undefined ? input.notes?.trim() || null : existing.notes,
        currency: input.currency?.trim() || existing.currency,
        dedupeKey: computeDedupeKey(occurredAt, amount, description),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.organisationId, organisationId)
        )
      )
      .returning();

    return updated ?? null;
  });
}

export async function deleteTransaction(
  organisationId: string,
  transactionId: string
): Promise<boolean> {
  return withOrgContext(organisationId, async tx => {
    const deleted = await tx
      .delete(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.organisationId, organisationId)
        )
      )
      .returning({ id: transactions.id });

    return deleted.length > 0;
  });
}

export async function summariseSpendByCategory(
  organisationId: string,
  filters: Pick<ListTransactionsFilters, "fromDate" | "toDate"> = {}
): Promise<CategorySpendRow[]> {
  const conditions = [eq(transactions.organisationId, organisationId)];

  if (filters.fromDate) {
    conditions.push(gte(transactions.occurredAt, filters.fromDate));
  }
  if (filters.toDate) {
    conditions.push(lte(transactions.occurredAt, filters.toDate));
  }

  return withOrgContext(organisationId, async tx => {
    await mergeStoredCategoryAliases(tx, organisationId);
    const category = canonicalCategorySql();
    return tx
      .select({
        category,
        total: sql<string>`coalesce(sum(${transactions.amount}), 0)::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(sql`1`);
  });
}

const BRAIN_CATEGORY_TAXONOMY_PATH = path.join(
  process.cwd(),
  "brain/blueprints/personal-finance/category-taxonomy.md"
);

async function loadBrainCategoryTaxonomy(): Promise<string[]> {
  try {
    const markdown = await readFile(BRAIN_CATEGORY_TAXONOMY_PATH, "utf8");
    return parseCategoryTaxonomyTable(markdown);
  } catch {
    return [];
  }
}

/** Brain taxonomy plus categories already assigned on this organisation's transactions. */
export async function listBrainTransactionCategories(
  organisationId: string
): Promise<string[]> {
  const taxonomy = await loadBrainCategoryTaxonomy();
  return withOrgContext(organisationId, async tx => {
    await mergeStoredCategoryAliases(tx, organisationId);
    const used = await tx
      .select({
        category: sql<string>`coalesce(${transactions.category}, 'Uncategorised')`,
      })
      .from(transactions)
      .where(eq(transactions.organisationId, organisationId))
      .groupBy(sql`1`);
    return uniqueSortedCategories([
      ...taxonomy,
      ...used.map(row => row.category),
    ]);
  });
}
