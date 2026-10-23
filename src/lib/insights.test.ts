import { describe, expect, it } from "vitest";
import {
  DISMISSED_INSIGHT_TITLE,
  groupInsightsForDisplay,
  insightMonthKey,
  tipRestates,
  tipsNotAlreadyStated,
} from "./insights";
import { groupBudgetsByCategory } from "./finance";

describe("tipRestates", () => {
  it("treats the same sentence as a restatement", () => {
    expect(
      tipRestates(
        "Countdown repeats weekly at about $90.",
        "countdown repeats weekly at about $90"
      )
    ).toBe(true);
  });

  it("keeps a tip when the amount has changed", () => {
    expect(
      tipRestates(
        "Dining is 31% of spend this month.",
        "Dining is 28% of spend this month."
      )
    ).toBe(false);
  });
});

describe("tipsNotAlreadyStated", () => {
  it("drops tips already stated and keeps the new one", () => {
    const fresh = tipsNotAlreadyStated(
      [
        "Countdown repeats weekly at about $90.",
        "Power bills stepped up in October.",
      ],
      ["Countdown repeats weekly at about $90."]
    );
    expect(fresh).toEqual(["Power bills stepped up in October."]);
  });
});

describe("groupInsightsForDisplay", () => {
  const october = new Date("2026-10-06T00:00:00.000Z");
  const octoberLater = new Date("2026-10-20T00:00:00.000Z");
  const november = new Date("2026-11-03T00:00:00.000Z");

  it("collapses the same category in one month", () => {
    const sections = groupInsightsForDisplay([
      {
        id: "early",
        category: "spending_trends",
        status: "ready",
        title: "Spending breakdown and trends",
        tips: ["Dining is 28% of spend this month."],
        createdAt: october,
      },
      {
        id: "later",
        category: "spending_trends",
        status: "ready",
        title: "Spending breakdown and trends",
        tips: [
          "Dining is 28% of spend this month.",
          "Power bills stepped up in October.",
        ],
        createdAt: octoberLater,
      },
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.cards).toHaveLength(1);
    expect(sections[0]?.cards[0]?.id).toBe("later");
    expect(sections[0]?.cards[0]?.monthKey).toBe(insightMonthKey(octoberLater));
    expect(sections[0]?.cards[0]?.showTitle).toBe(false);
    expect(sections[0]?.cards[0]?.tips).toEqual([
      "Dining is 28% of spend this month.",
      "Power bills stepped up in October.",
    ]);
  });

  it("hides a later card that only repeats an earlier month", () => {
    const sections = groupInsightsForDisplay([
      {
        id: "oct",
        category: "spending_trends",
        status: "ready",
        title: "October mix",
        tips: ["Dining is 28% of spend this month."],
        createdAt: october,
      },
      {
        id: "nov",
        category: "anomalies",
        status: "ready",
        title: "Anomalies and optimisation",
        tips: ["Dining is 28% of spend this month."],
        createdAt: november,
      },
    ]);

    const cards = sections.flatMap(section => section.cards);
    expect(cards.map(card => card.id)).toEqual(["oct"]);
  });

  it("keeps a later card when the figure has changed", () => {
    const sections = groupInsightsForDisplay([
      {
        id: "oct",
        category: "spending_trends",
        status: "ready",
        title: "October mix",
        tips: ["Dining is 28% of spend this month."],
        createdAt: october,
      },
      {
        id: "nov",
        category: "spending_trends",
        status: "ready",
        title: "November mix",
        tips: ["Dining is 31% of spend this month."],
        createdAt: november,
      },
    ]);

    const cards = sections.flatMap(section => section.cards);
    expect(cards.map(card => card.id)).toEqual(["nov", "oct"]);
    expect(cards.find(card => card.id === "nov")?.tips).toEqual([
      "Dining is 31% of spend this month.",
    ]);
  });

  it("omits a dismissed month", () => {
    const sections = groupInsightsForDisplay([
      {
        id: "gone",
        category: "budget_alerts",
        status: "ready",
        title: DISMISSED_INSIGHT_TITLE,
        tips: [],
        createdAt: october,
      },
    ]);
    expect(sections).toEqual([]);
  });
});

describe("groupBudgetsByCategory", () => {
  it("puts periods for one category on a single group", () => {
    const groups = groupBudgetsByCategory([
      {
        category: "Groceries",
        period: "monthly" as const,
        startsOn: "2026-10-01",
      },
      {
        category: "Dining",
        period: "monthly" as const,
        startsOn: "2026-10-01",
      },
      {
        category: "Groceries",
        period: "weekly" as const,
        startsOn: "2026-10-06",
      },
    ]);

    expect(groups.map(group => group.category)).toEqual(["Dining", "Groceries"]);
    expect(groups[1]?.budgets.map(budget => budget.period)).toEqual([
      "weekly",
      "monthly",
    ]);
  });
});
