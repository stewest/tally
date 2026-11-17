import { describe, expect, it } from "vitest";
import {
  canonicaliseCategory,
  categoryLookupValues,
  groupBudgetsByCategory,
  isTransactionCategory,
  parseCategoryTaxonomyTable,
  TRANSACTION_CATEGORIES,
  uniqueSortedCategories,
} from "./finance";

describe("category aliases", () => {
  it("keeps Giving on the dropdown and leaves the retired names off it", () => {
    expect(TRANSACTION_CATEGORIES).toContain("Giving");
    expect(TRANSACTION_CATEGORIES).toContain("Dining");
    expect(isTransactionCategory("Giving")).toBe(true);
    expect(isTransactionCategory("Donations")).toBe(false);
    expect(isTransactionCategory("Giving & Donations")).toBe(false);
    expect(isTransactionCategory("Dining & Drinks")).toBe(false);
  });

  it("folds duplicate names into one category", () => {
    expect(canonicaliseCategory("Donations")).toBe("Giving");
    expect(canonicaliseCategory(" giving & donations ")).toBe("Giving");
    expect(canonicaliseCategory("Dining & Drinks")).toBe("Dining");
    expect(canonicaliseCategory("Groceries")).toBe("Groceries");
    expect(canonicaliseCategory("  ")).toBeNull();
  });

  it("looks up every stored label that belongs to Giving", () => {
    expect(categoryLookupValues("Donations").sort()).toEqual(
      ["Donations", "Giving", "Giving & Donations"].sort()
    );
    expect(categoryLookupValues("Dining")).toEqual(
      expect.arrayContaining(["Dining", "Dining & Drinks"])
    );
  });

  it("groups alias budgets with the dropdown category", () => {
    const groups = groupBudgetsByCategory([
      {
        category: "Donations",
        period: "monthly",
        startsOn: "2026-01-01",
      },
      {
        category: "Giving",
        period: "weekly",
        startsOn: "2026-01-01",
      },
      {
        category: "Dining & Drinks",
        period: "monthly",
        startsOn: "2026-02-01",
      },
    ]);

    expect(groups.map(group => group.category)).toEqual(["Dining", "Giving"]);
    expect(groups.find(group => group.category === "Giving")?.budgets).toHaveLength(2);
  });
});

describe("parseCategoryTaxonomyTable", () => {
  it("reads category names from the Brain taxonomy table", () => {
    const markdown = `
| Category | Examples |
|---|---|
| Housing | Rent |
| Dining | Cafes |
| Giving | Tithe |
`;
    expect(parseCategoryTaxonomyTable(markdown)).toEqual([
      "Dining",
      "Giving",
      "Housing",
    ]);
  });

  it("folds retired names when they appear in the table", () => {
    expect(
      uniqueSortedCategories(["Donations", "Dining & Drinks", "Clothing"])
    ).toEqual(["Clothing", "Dining", "Giving"]);
  });
});
