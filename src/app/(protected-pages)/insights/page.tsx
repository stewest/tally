"use client";

import { useMemo, useState } from "react";
import type { InsightCategory } from "@db/schema";
import Modal from "@/components/Modal";
import Button from "@/components/buttons/Button";
import InsightQueueForm from "@/components/finance/InsightQueueForm";
import BaseCard from "@/components/ui/BaseCard";
import { Icon } from "@/components/ui/Icon";
import {
  useDismissInsight,
  useInsights,
  useQueueInsights,
} from "@/hooks/useInsights";
import { usePageLayout } from "@/hooks/usePageLayout";
import { useTransactions } from "@/hooks/useTransactions";
import { getAppName } from "@/lib/app";
import {
  type InsightCardView,
  groupInsightsForDisplay,
  summariseInsightTips,
} from "@/lib/insights";
import RowActionMenu from "@/components/ui/RowActionMenu";
import { formatRelativeTime } from "@/lib/chat";

const DISMISS_HINT =
  "Dismiss hides this month's insight. It is not shown or written again until next month.";

function insightCreatedLabel(value: Date | string): string {
  return formatRelativeTime(value);
}

function InsightCard({
  card,
  onOpen,
  onDismiss,
}: {
  card: InsightCardView;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const summaryTips = summariseInsightTips(card.tips);
  const remainingCount = Math.max(card.tips.length - summaryTips.length, 0);

  return (
    <BaseCard className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onOpen}
        >
          <h3 className="text-lg font-semibold text-gray-900">{card.monthLabel}</h3>
          {card.status === "ready" && card.showTitle && (
            <p className="mt-1 text-sm text-gray-500">{card.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {insightCreatedLabel(card.createdAt)}
          </p>
        </button>
        <RowActionMenu
          items={[
            {
              icon: "archive",
              label: "Dismiss",
              destructive: true,
              onClick: onDismiss,
            },
          ]}
        />
      </div>

      <button type="button" className="w-full text-left" onClick={onOpen}>
        {card.status === "analysing" && (
          <p className="text-sm text-gray-500">Analysing...</p>
        )}

        {card.status === "failed" && (
          <p className="line-clamp-2 text-sm text-red-600">
            {card.title || "Could not analyse this category."}
          </p>
        )}

        {card.status === "ready" && summaryTips.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
            {summaryTips.map(tip => (
              <li key={tip} className="line-clamp-2">
                {tip}
              </li>
            ))}
          </ul>
        )}

        {card.status === "ready" && remainingCount > 0 && (
          <p className="mt-2 text-sm text-blue-600">
            View {remainingCount} more
          </p>
        )}
      </button>
    </BaseCard>
  );
}

export default function InsightsPage() {
  usePageLayout(useMemo(() => ({ breadcrumbs: [{ label: "Insights" }] }), []));

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const insightsQuery = useInsights();
  const transactionsQuery = useTransactions();
  const queueInsights = useQueueInsights();
  const dismissInsight = useDismissInsight();

  const insightRows = insightsQuery.data?.insights ?? [];
  const sections = useMemo(
    () => groupInsightsForDisplay(insightRows),
    [insightRows]
  );
  const viewingCard = viewingId
    ? sections.flatMap(section => section.cards).find(card => card.id === viewingId) ??
      null
    : null;
  const hasTransactions = (transactionsQuery.data?.length ?? 0) > 0;
  const isLoading = insightsQuery.isLoading || transactionsQuery.isLoading;
  const appName = getAppName();

  const handleQueue = async (categories: InsightCategory[]) => {
    try {
      await queueInsights.mutateAsync(categories);
      setIsQueueOpen(false);
    } catch {
      // Toast is handled by the mutation
    }
  };

  const handleDismiss = async (id: string) => {
    if (dismissInsight.isPending) return;
    try {
      await dismissInsight.mutateAsync(id);
      if (viewingId === id) {
        setViewingId(null);
      }
    } catch {
      // Toast is handled by the mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-600">
            Short, actionable advice from {appName} based on your transactions.
          </p>
        </div>
        {insightRows.length > 0 && (
          <Button onClick={() => setIsQueueOpen(true)}>
            <Icon icon="plus" className="mr-2 h-4 w-4" />
            Add new insight
          </Button>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500">Loading insights…</p>
      )}

      {!isLoading && insightRows.length === 0 && !hasTransactions && (
        <BaseCard>
          <p className="text-gray-600">
            No new insights. Add transactions via the chat, for {appName} to
            analyse.
          </p>
        </BaseCard>
      )}

      {!isLoading && insightRows.length === 0 && hasTransactions && (
        <BaseCard className="flex flex-col items-center py-12 text-center">
          <Icon icon="userTie" className="mb-4 h-12 w-12 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Add insights</h2>
          <p className="mt-1 max-w-md text-sm text-gray-600">
            Queue a Brain job to analyse your transactions. You can watch the
            run in your local Brain UI.
          </p>
          <Button className="mt-6" onClick={() => setIsQueueOpen(true)}>
            Queue up an insight
          </Button>
        </BaseCard>
      )}

      {insightRows.length > 0 && sections.length === 0 && (
        <BaseCard>
          <p className="text-gray-600">
            Nothing new to show. Those findings are already on an earlier
            insight.
          </p>
        </BaseCard>
      )}

      {sections.map(section => (
        <section key={section.category} className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500">{section.label}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {section.cards.map(card => (
              <InsightCard
                key={card.id}
                card={card}
                onOpen={() => setViewingId(card.id)}
                onDismiss={() => {
                  void handleDismiss(card.id);
                }}
              />
            ))}
          </div>
        </section>
      ))}

      {isQueueOpen && (
        <Modal
          title="What insight categories would you like?"
          onClose={() => setIsQueueOpen(false)}
        >
          <InsightQueueForm
            onSubmit={categories => {
              void handleQueue(categories);
            }}
            onCancel={() => setIsQueueOpen(false)}
            isSubmitting={queueInsights.isPending}
          />
        </Modal>
      )}

      {viewingCard && (
        <Modal
          title={viewingCard.monthLabel}
          maxWidth="lg"
          onClose={() => setViewingId(null)}
        >
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <p className="mb-1 text-sm text-gray-500">
              {sections.find(section =>
                section.cards.some(card => card.id === viewingCard.id)
              )?.label}
            </p>
            <p className="mb-4 text-xs text-gray-400">
              {insightCreatedLabel(viewingCard.createdAt)}
            </p>
            {viewingCard.status === "ready" && viewingCard.showTitle && (
              <p className="mb-4 text-sm text-gray-600">{viewingCard.title}</p>
            )}
            {viewingCard.status === "analysing" && (
              <p className="text-sm text-gray-500">Analysing...</p>
            )}
            {viewingCard.status === "failed" && (
              <p className="text-sm text-red-600">
                {viewingCard.title || "Could not analyse this category."}
              </p>
            )}
            {viewingCard.status === "ready" && viewingCard.tips.length > 0 && (
              <ul className="list-disc space-y-3 pl-5 text-sm text-gray-700">
                {viewingCard.tips.map(tip => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-gray-400">{DISMISS_HINT}</p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="dangerSoft"
              title={DISMISS_HINT}
              aria-label="Dismiss"
              onClick={() => {
                void handleDismiss(viewingCard.id);
              }}
              disabled={dismissInsight.isPending}
            >
              Dismiss
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewingId(null)}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
