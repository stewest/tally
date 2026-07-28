export interface ColumnFilter {
  id: string;
  value: unknown;
}

export type ColumnFiltersState = ColumnFilter[];

export interface ExpenseFilterState {
  dateRange: {
    startDate: string;
    endDate: string;
    useCustomRange: boolean;
  };
  statusFilter: string[];
  typeFilter: string[];
}
