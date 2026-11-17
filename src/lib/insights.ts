import type { InsightCategory } from "@db/schema";

export const INSIGHT_CATEGORIES = [
  "budgeting_spending",
  "saving_emergency",
  "debt_credit",
  "investing_growth",
  "spending_trends",
  "budget_alerts",
  "anomalies",
] as const;

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  budgeting_spending: "Budgeting and Spending",
  saving_emergency: "Saving and Emergency Funds",
  debt_credit: "Debt and Credit",
  investing_growth: "Investing and Growth",
  spending_trends: "Spending breakdown and trends",
  budget_alerts: "Budget and goal alerts",
  anomalies: "Anomalies and optimisation",
};

export function isInsightCategory(value: string): value is InsightCategory {
  return (INSIGHT_CATEGORIES as readonly string[]).includes(value);
}

export const INSIGHT_CARD_SUMMARY_LIMIT = 2;

/** Ready row kept so this category is not written again for that month. */
export const DISMISSED_INSIGHT_TITLE = "__dismissed__";

const TIP_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "this",
  "that",
  "with",
  "from",
  "your",
  "have",
  "has",
  "was",
  "were",
  "are",
  "but",
  "not",
  "you",
  "its",
  "per",
  "about",
  "into",
  "over",
  "than",
  "then",
  "also",
  "just",
]);

export function summariseInsightTips(
  tips: string[],
  limit = INSIGHT_CARD_SUMMARY_LIMIT
): string[] {
  return tips.filter(tip => tip.trim().length > 0).slice(0, limit);
}

export function isDismissedInsight(insight: {
  status: string;
  title: string;
  tips: readonly string[];
}): boolean {
  return (
    insight.status === "ready" &&
    insight.title === DISMISSED_INSIGHT_TITLE &&
    insight.tips.length === 0
  );
}

export function insightMonthKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

export function insightMonthLabel(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-NZ", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function insightTitleRepeatsCategory(
  title: string,
  category: InsightCategory
): boolean {
  const value = title.trim().toLowerCase();
  return value.length === 0 || value === INSIGHT_CATEGORY_LABELS[category].trim().toLowerCase();
}

export function normaliseTip(tip: string): string {
  return tip
    .toLowerCase()
    .replace(/(\d),(\d)/g, "$1$2")
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numericTokens(tip: string): number[] {
  const matches = normaliseTip(tip).match(/\d+(?:\.\d+)?/g) ?? [];
  return matches
    .map(value => Number(value))
    .filter(value => Number.isFinite(value));
}

function contentWords(normalised: string): Set<string> {
  return new Set(
    normalised
      .split(" ")
      .filter(word => word.length > 2 && !TIP_STOP_WORDS.has(word) && !/^\d+(?:\.\d+)?$/.test(word))
  );
}

export function tipRestates(candidate: string, prior: string): boolean {
  const left = normaliseTip(candidate);
  const right = normaliseTip(prior);
  if (!left || !right) return false;
  if (left === right) return true;

  const leftNumbers = numericTokens(candidate);
  const rightNumbers = numericTokens(prior);
  const numbersDiffer =
    leftNumbers.length !== rightNumbers.length ||
    leftNumbers.some((value, index) => value !== rightNumbers[index]);
  if (numbersDiffer) return false;

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;
  if (shorter.length >= 24 && longer.includes(shorter)) return true;

  const leftWords = contentWords(left);
  const rightWords = contentWords(right);
  if (leftWords.size < 4 || rightWords.size < 4) return false;
  let shared = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) shared += 1;
  }
  return shared / Math.min(leftWords.size, rightWords.size) >= 0.8;
}

export function tipsNotAlreadyStated(
  tips: readonly string[],
  priorTips: readonly string[]
): string[] {
  const kept: string[] = [];
  const seen = [...priorTips];
  for (const tip of tips) {
    const trimmed = tip.trim();
    if (!trimmed) continue;
    if (seen.some(prior => tipRestates(trimmed, prior))) continue;
    kept.push(trimmed);
    seen.push(trimmed);
  }
  return kept;
}

export interface InsightCardView {
  id: string;
  category: InsightCategory;
  monthKey: string;
  monthLabel: string;
  status: "analysing" | "ready" | "failed";
  title: string;
  showTitle: boolean;
  tips: string[];
  createdAt: string;
}

export interface InsightSectionView {
  category: InsightCategory;
  label: string;
  cards: InsightCardView[];
}

interface InsightDisplayRow {
  id: string;
  category: InsightCategory;
  status: InsightCardView["status"];
  title: string;
  tips: readonly string[];
  createdAt: Date | string;
}

function insightTime(value: Date | string): number {
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function asIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

export function groupInsightsForDisplay(
  rows: readonly InsightDisplayRow[]
): InsightSectionView[] {
  const visible = rows.filter(row => !isDismissedInsight(row));
  const buckets = new Map<string, InsightDisplayRow[]>();

  for (const row of visible) {
    const key = `${row.category}|${insightMonthKey(row.createdAt)}`;
    const list = buckets.get(key) ?? [];
    list.push(row);
    buckets.set(key, list);
  }

  const collapsed: InsightCardView[] = [];
  for (const list of buckets.values()) {
    const sorted = [...list].sort(
      (a, b) => insightTime(b.createdAt) - insightTime(a.createdAt)
    );
    const newest = sorted[0];
    if (!newest) continue;

    let tips: string[] = [];
    if (newest.status === "ready") {
      for (const row of sorted) {
        if (row.status !== "ready") continue;
        tips = [...tips, ...tipsNotAlreadyStated(row.tips, tips)];
      }
    }

    collapsed.push({
      id: newest.id,
      category: newest.category,
      monthKey: insightMonthKey(newest.createdAt),
      monthLabel: insightMonthLabel(newest.createdAt),
      status: newest.status,
      title: newest.title,
      showTitle: !insightTitleRepeatsCategory(newest.title, newest.category),
      tips,
      createdAt: asIso(newest.createdAt),
    });
  }

  const stated: string[] = [];
  const shown: InsightCardView[] = [];
  for (const card of [...collapsed].sort(
    (a, b) => insightTime(a.createdAt) - insightTime(b.createdAt)
  )) {
    if (card.status !== "ready") {
      shown.push(card);
      continue;
    }
    const fresh = tipsNotAlreadyStated(card.tips, stated);
    stated.push(...fresh);
    if (fresh.length === 0) continue;
    shown.push({ ...card, tips: fresh });
  }

  const byCategory = new Map<InsightCategory, InsightCardView[]>();
  for (const card of shown) {
    const list = byCategory.get(card.category) ?? [];
    list.push(card);
    byCategory.set(card.category, list);
  }

  return INSIGHT_CATEGORIES.flatMap(category => {
    const cards = byCategory.get(category);
    if (!cards || cards.length === 0) return [];
    cards.sort((a, b) => insightTime(b.createdAt) - insightTime(a.createdAt));
    return [{ category, label: INSIGHT_CATEGORY_LABELS[category], cards }];
  });
}
