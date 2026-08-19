import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { useToast } from "@/components/ui/Toast";
import type { InsightCategory } from "@db/schema";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "error" in data) {
      const message = (data as { error?: unknown }).error;
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
    }
    if (error.response?.status === 401) {
      return "You are not signed in.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function useInsights() {
  return useQuery({
    queryKey: ["insights"],
    queryFn: async () => {
      const response = await axios.get<ListInsightsResponse>(
        "/api/finance/insights"
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Failed to fetch insights");
      }
      return response.data.data;
    },
    refetchInterval: query => {
      const rows = query.state.data?.insights ?? [];
      if (!rows.some(insight => insight.status === "analysing")) {
        return false;
      }
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return 8000;
      }
      return 2000;
    },
    refetchIntervalInBackground: true,
  });
}

export function useQueueInsights() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (categories: InsightCategory[]) => {
      try {
        const response = await axios.post<QueueInsightsResponse>(
          "/api/finance/insights",
          { categories } satisfies QueueInsightsRequest
        );
        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.error || "Failed to queue insights");
        }
        return response.data.data;
      } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to queue insights"));
      }
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      const queued = data.filter(insight => insight.status === "analysing").length;
      addToast(
        queued === 1 ? "Insight queued" : `${queued} insights queued`,
        "success"
      );
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to queue insights", "error");
    },
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete<DismissInsightResponse>(
        `/api/finance/insights/${id}`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to dismiss insight");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      addToast("Insight dismissed", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to dismiss insight", "error");
    },
  });
}
