import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/Toast";

export interface TransactionListFilters {
  fromDate?: string;
  toDate?: string;
  category?: string;
  account?: string;
  search?: string;
}

export function useTransactions(filters: TransactionListFilters = {}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const response = await axios.get<ListTransactionsResponse>(
        "/api/finance/transactions",
        { params: filters }
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch transactions");
      }
      return response.data.data || [];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateTransactionRequest) => {
      const response = await axios.post<CreateTransactionResponse>(
        "/api/finance/transactions",
        params
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Failed to create transaction");
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
      addToast("Transaction added", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to create transaction", "error");
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...params
    }: UpdateTransactionRequest & { id: string }) => {
      const response = await axios.put<UpdateTransactionResponse>(
        `/api/finance/transactions/${id}`,
        params
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Failed to update transaction");
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
      addToast("Transaction updated", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to update transaction", "error");
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete<DeleteTransactionResponse>(
        `/api/finance/transactions/${id}`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to delete transaction");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
      addToast("Transaction deleted", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to delete transaction", "error");
    },
  });
}
