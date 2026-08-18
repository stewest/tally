import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { useToast } from "@/components/ui/Toast";

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

function assertSuccessData<T>(
  data: { success: boolean; data?: T; error?: string } | undefined,
  fallback: string
): T {
  if (!data || typeof data !== "object" || !data.success || data.data === undefined) {
    throw new Error(data?.error || fallback);
  }
  return data.data;
}

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const response = await axios.get<ListBudgetsResponse>("/api/finance/budgets");
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch budgets");
      }
      return response.data.data || [];
    },
  });
}

export function useUpsertBudget() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (params: UpsertBudgetRequest) => {
      try {
        const response = await axios.post<UpsertBudgetResponse>(
          "/api/finance/budgets",
          params
        );
        return assertSuccessData(response.data, "Failed to save budget");
      } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to save budget"));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
      addToast("Budget saved", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to save budget", "error");
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...params
    }: UpdateBudgetRequest & { id: string }) => {
      const response = await axios.put<UpdateBudgetResponse>(
        `/api/finance/budgets/${id}`,
        params
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Failed to update budget");
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
      addToast("Budget updated", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to update budget", "error");
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete<DeleteBudgetResponse>(
        `/api/finance/budgets/${id}`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to delete budget");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
      addToast("Budget deleted", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to delete budget", "error");
    },
  });
}
