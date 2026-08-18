import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface FinanceSummaryFilters {
  fromDate?: string;
  toDate?: string;
}

export function useFinanceSummary(filters: FinanceSummaryFilters = {}) {
  return useQuery({
    queryKey: ["financeSummary", filters],
    queryFn: async () => {
      const response = await axios.get<FinanceSummaryResponse>(
        "/api/finance/summary",
        { params: filters }
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Failed to fetch finance summary");
      }
      return response.data.data;
    },
  });
}
