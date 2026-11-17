import { db, withOrgContext } from "@db/index";
import {
  insights,
  organisations,
  transactions,
  type Insight,
  type InsightCategory,
} from "@db/schema";
import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import {
  DISMISSED_INSIGHT_TITLE,
  INSIGHT_CATEGORY_LABELS,
  insightMonthKey,
  insightTitleRepeatsCategory,
  isDismissedInsight,
  tipsNotAlreadyStated,
} from "@/lib/insights";
import {
  createBrainUnitOfWork,
  isBrainConfigured,
  runWorkflowAsync,
} from "@/server/brain/client";
import { ensureBrainEntityForOrganisation } from "@/server/brain/entities";

const INSIGHT_WORKFLOW_CODE = "WF-FINANCE-INSIGHT";
const DAILY_INSIGHT_WORKFLOW_CODE = "WF-FINANCE-DAILY";
const INSIGHT_UNIT_OF_WORK_TYPE = "insight";
const NOTHING_NEW_TIP = "No change from the insights already recorded.";

export async function listInsights(organisationId: string): Promise<Insight[]> {
  const rows = await withOrgContext(organisationId, tx =>
    tx
      .select()
      .from(insights)
      .where(eq(insights.organisationId, organisationId))
      .orderBy(desc(insights.createdAt))
  );
  return rows.filter(row => !isDismissedInsight(row));
}

export async function organisationHasTransactions(
  organisationId: string
): Promise<boolean> {
  return withOrgContext(organisationId, async tx => {
    const [row] = await tx
      .select({ value: count() })
      .from(transactions)
      .where(eq(transactions.organisationId, organisationId));

    return (row?.value ?? 0) > 0;
  });
}

export async function queueInsights(
  organisationId: string,
  categories: InsightCategory[]
): Promise<Insight[]> {
  if (!isBrainConfigured()) {
    throw new Error(
      "Brain is not configured. Set BRAIN_API_KEY and BRAIN_URL, or add the Telos Brain Vercel integration."
    );
  }

  const entityId = await ensureBrainEntityForOrganisation(organisationId);
  if (!entityId) {
    throw new Error(
      "Brain is not configured. Set BRAIN_API_KEY and BRAIN_URL, or add the Telos Brain Vercel integration."
    );
  }

  const created: Insight[] = [];
  const monthKey = insightMonthKey(new Date());

  for (const category of categories) {
    const row = await withOrgContext(organisationId, async tx => {
      const history = await tx
        .select()
        .from(insights)
        .where(eq(insights.organisationId, organisationId));
      const monthRows = history
        .filter(
          item =>
            item.category === category && insightMonthKey(item.createdAt) === monthKey
        )
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
      const existing = monthRows[0];

      if (existing) {
        const otherIds = monthRows.slice(1).map(item => item.id);
        if (otherIds.length > 0) {
          await tx
            .update(insights)
            .set({
              status: "ready",
              title: DISMISSED_INSIGHT_TITLE,
              tips: [],
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(insights.organisationId, organisationId),
                inArray(insights.id, otherIds)
              )
            );
        }

        const [updated] = await tx
          .update(insights)
          .set({
            status: "analysing",
            title: "",
            tips: [],
            brainUnitOfWorkId: null,
            brainRunId: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(insights.id, existing.id),
              eq(insights.organisationId, organisationId)
            )
          )
          .returning();
        return updated;
      }

      const [inserted] = await tx
        .insert(insights)
        .values({
          organisationId,
          category,
          status: "analysing",
          title: "",
          tips: [],
        })
        .returning();
      return inserted;
    });

    if (!row) {
      throw new Error("Insight was not saved.");
    }

    try {
      let unitOfWorkId: string | undefined;
      try {
        const unitOfWork = await createBrainUnitOfWork({
          entityId,
          unitOfWorkTypeCode: INSIGHT_UNIT_OF_WORK_TYPE,
          title: `${INSIGHT_CATEGORY_LABELS[category]} insight`,
          variables: [{ key: "insightId", value: row.id }],
        });
        unitOfWorkId = unitOfWork.id;
      } catch (unitOfWorkError) {
        console.error(
          "Insight unit of work was not created; queueing the run without it:",
          unitOfWorkError
        );
      }

      const run = await runWorkflowAsync(INSIGHT_WORKFLOW_CODE, {
        entityId,
        unitOfWorkId,
        inputMessage: `Analyse the organisation's transactions and produce a ${INSIGHT_CATEGORY_LABELS[category]} insight.`,
        variables: {
          insightId: row.id,
          category,
        },
      });

      const updated = await withOrgContext(organisationId, async tx => {
        const [saved] = await tx
          .update(insights)
          .set({
            brainUnitOfWorkId: unitOfWorkId ?? null,
            brainRunId: run.runId,
            updatedAt: new Date(),
          })
          .where(eq(insights.id, row.id))
          .returning();
        return saved;
      });

      created.push(updated ?? row);
    } catch (error) {
      console.error("Failed to start insight analysis:", error);
      const detail =
        error instanceof Error && error.message
          ? error.message
          : "Could not analyse this category.";
      const failed = await withOrgContext(organisationId, async tx => {
        const [saved] = await tx
          .update(insights)
          .set({
            status: "failed",
            title: detail,
            updatedAt: new Date(),
          })
          .where(eq(insights.id, row.id))
          .returning();
        return saved;
      });

      created.push(
        failed ?? {
          ...row,
          status: "failed",
          title: detail,
        }
      );
    }
  }

  const analysingCount = created.filter(
    insight => insight.status === "analysing"
  ).length;
  if (analysingCount === 0) {
    const firstFailure = created.find(insight => insight.title)?.title;
    throw new Error(
      firstFailure ||
        "Could not start Brain analysis. Deploy the local brain schema so WF-FINANCE-INSIGHT exists."
    );
  }

  return created;
}

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    if ("code" in current && (current as { code: unknown }).code === "23505") {
      return true;
    }
    current = "cause" in current ? (current as { cause: unknown }).cause : undefined;
  }
  return false;
}

export async function createReadyInsight(
  organisationId: string,
  input: { category: InsightCategory; title: string; tips: string[] }
): Promise<{ insight: Insight | null; alreadyRecorded: boolean; appended: boolean }> {
  const hasTransactions = await organisationHasTransactions(organisationId);
  if (!hasTransactions) {
    throw new Error("Add transactions before creating an insight.");
  }

  const title = input.title.trim();
  const tips = input.tips.map(tip => tip.trim()).filter(tip => tip.length > 0);

  if (!title) {
    throw new Error("title is required.");
  }
  if (tips.length === 0) {
    throw new Error("tips must include at least one sentence.");
  }

  const monthKey = insightMonthKey(new Date());

  return withOrgContext(organisationId, async tx => {
    const history = await tx
      .select()
      .from(insights)
      .where(eq(insights.organisationId, organisationId));
    const blocking = blockingInsight(history, input.category, monthKey);
    const priorTips = statedTips(history);

    if (blocking && !isDismissedInsight(blocking) && blocking.status === "ready") {
      const freshTips = tipsNotAlreadyStated(tips, priorTips);
      if (freshTips.length === 0) {
        return { insight: blocking, alreadyRecorded: true, appended: false };
      }

      const nextTitle =
        insightTitleRepeatsCategory(blocking.title, input.category) &&
        !insightTitleRepeatsCategory(title, input.category)
          ? title
          : blocking.title;
      const [updated] = await tx
        .update(insights)
        .set({
          title: nextTitle,
          tips: [...blocking.tips, ...freshTips],
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(insights.id, blocking.id),
            eq(insights.organisationId, organisationId)
          )
        )
        .returning();

      return {
        insight: updated ?? blocking,
        alreadyRecorded: true,
        appended: true,
      };
    }

    if (blocking) {
      return { insight: blocking, alreadyRecorded: true, appended: false };
    }

    const freshTips = tipsNotAlreadyStated(tips, priorTips);
    if (freshTips.length === 0) {
      return { insight: null, alreadyRecorded: true, appended: false };
    }

    try {
      const [inserted] = await tx
        .insert(insights)
        .values({
          organisationId,
          category: input.category,
          status: "ready",
          title,
          tips: freshTips,
        })
        .returning();

      if (!inserted) {
        throw new Error("Insight was not saved.");
      }

      return { insight: inserted, alreadyRecorded: false, appended: false };
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      const again = await tx
        .select()
        .from(insights)
        .where(eq(insights.organisationId, organisationId));
      const duplicate = blockingInsight(again, input.category, monthKey);
      if (!duplicate) {
        throw error;
      }

      return { insight: duplicate, alreadyRecorded: true, appended: false };
    }
  });
}

function statedTips(history: Insight[]): string[] {
  return history
    .filter(row => row.status === "ready" && !isDismissedInsight(row))
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
    .flatMap(row => row.tips);
}

function blockingInsight(
  history: Insight[],
  category: InsightCategory,
  monthKey: string
): Insight | undefined {
  const monthRows = history
    .filter(
      row => row.category === category && insightMonthKey(row.createdAt) === monthKey
    )
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  return (
    monthRows.find(
      row =>
        row.status === "analysing" ||
        (row.status === "ready" && !isDismissedInsight(row))
    ) ?? monthRows.find(row => isDismissedInsight(row))
  );
}

export async function startDailyInsightRuns(): Promise<{
  started: number;
  skipped: number;
  failed: number;
}> {
  if (!isBrainConfigured()) {
    throw new Error(
      "Brain is not configured. Set BRAIN_API_KEY and BRAIN_URL, or add the Telos Brain Vercel integration."
    );
  }

  const orgs = await db
    .select({
      id: organisations.id,
      brainEntityId: organisations.brainEntityId,
    })
    .from(organisations)
    .where(isNotNull(organisations.brainEntityId));

  let started = 0;
  let skipped = 0;
  let failed = 0;

  for (const org of orgs) {
    if (!org.brainEntityId) {
      skipped += 1;
      continue;
    }

    const hasTransactions = await organisationHasTransactions(org.id);
    if (!hasTransactions) {
      skipped += 1;
      continue;
    }

    try {
      await runWorkflowAsync(DAILY_INSIGHT_WORKFLOW_CODE, {
        entityId: org.brainEntityId,
        inputMessage:
          "Review this month's transactions and update the insight cards. Do not restate a finding already recorded.",
      });
      started += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `Failed to start daily insights for organisation ${org.id}:`,
        error
      );
    }
  }

  return { started, skipped, failed };
}

export async function completeInsight(
  organisationId: string,
  insightId: string,
  input: { title: string; tips: string[] }
): Promise<Insight> {
  const title = input.title.trim();
  const tips = input.tips.map(tip => tip.trim()).filter(tip => tip.length > 0);

  if (!title) {
    throw new Error("title is required.");
  }
  if (tips.length === 0) {
    throw new Error("tips must include at least one sentence.");
  }

  return withOrgContext(organisationId, async tx => {
    const [existing] = await tx
      .select()
      .from(insights)
      .where(
        and(eq(insights.id, insightId), eq(insights.organisationId, organisationId))
      )
      .limit(1);

    if (!existing) {
      throw new Error("Insight not found.");
    }
    if (isDismissedInsight(existing)) {
      return existing;
    }

    const history = await tx
      .select()
      .from(insights)
      .where(eq(insights.organisationId, organisationId));
    const monthKey = insightMonthKey(existing.createdAt);
    const priorTips = history
      .filter(
        row =>
          row.id !== existing.id &&
          row.status === "ready" &&
          !isDismissedInsight(row) &&
          !(
            row.category === existing.category &&
            insightMonthKey(row.createdAt) === monthKey
          )
      )
      .flatMap(row => row.tips);
    const freshTips = tipsNotAlreadyStated(tips, priorTips);
    const savedTips = freshTips.length > 0 ? freshTips : [NOTHING_NEW_TIP];

    const [updated] = await tx
      .update(insights)
      .set({
        status: "ready",
        title,
        tips: savedTips,
        updatedAt: new Date(),
      })
      .where(
        and(eq(insights.id, insightId), eq(insights.organisationId, organisationId))
      )
      .returning();

    if (!updated) {
      throw new Error("Insight not found.");
    }

    return updated;
  });
}

export async function dismissInsight(
  organisationId: string,
  insightId: string
): Promise<boolean> {
  return withOrgContext(organisationId, async tx => {
    const [target] = await tx
      .select()
      .from(insights)
      .where(
        and(eq(insights.id, insightId), eq(insights.organisationId, organisationId))
      )
      .limit(1);

    if (!target) return false;
    if (isDismissedInsight(target)) return true;

    const monthKey = insightMonthKey(target.createdAt);
    const history = await tx
      .select()
      .from(insights)
      .where(eq(insights.organisationId, organisationId));
    const ids = history
      .filter(
        row =>
          row.category === target.category &&
          insightMonthKey(row.createdAt) === monthKey &&
          !isDismissedInsight(row)
      )
      .map(row => row.id);

    if (ids.length === 0) return true;

    await tx
      .update(insights)
      .set({
        status: "ready",
        title: DISMISSED_INSIGHT_TITLE,
        tips: [],
        updatedAt: new Date(),
      })
      .where(
        and(eq(insights.organisationId, organisationId), inArray(insights.id, ids))
      );

    return true;
  });
}
