"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnSizingState,
} from "@tanstack/react-table";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Icon } from "./Icon";
import Pagination from "./Pagination";
import { ColumnFiltersState } from "@/types/table";

interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
  showPagination?: boolean;
  pageSizeOptions?: number[];
  initialColumnFilters?: ColumnFiltersState;
  globalFilter?: string;
  globalFilterFn?: (row: any, columnId: string, filterValue: string) => boolean;
  onFiltersChange?: (filters: ColumnFiltersState) => void;
  onGlobalFilterChange?: (filter: string) => void;
}

// Define what methods/properties we want to expose
export interface TableRef<T> {
  getFilteredData: () => T[];
  getFilteredRowCount: () => number;
  getCurrentPageData: () => T[];
  getAllData: () => T[];
  getTable: () => ReturnType<typeof useReactTable<T>>;
}

const Table = forwardRef<TableRef<any>, TableProps<any>>(function Table<T>(
  {
    data,
    columns,
    isLoading = false,
    emptyMessage = "No data found",
    onRowClick,
    className = "",
    showPagination = true,
    pageSizeOptions = [10, 20, 50, 100],
    initialColumnFilters = [],
    globalFilter = "",
    globalFilterFn,
    onFiltersChange,
    onGlobalFilterChange,
  }: TableProps<T>,
  ref: React.Ref<TableRef<T>>
) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialColumnFilters);
  const [globalFilterValue, setGlobalFilterValue] = useState(globalFilter);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  // Sync prop changes with internal state
  useEffect(() => {
    setColumnFilters(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(initialColumnFilters)) {
        return initialColumnFilters;
      }
      return prev;
    });
  }, [initialColumnFilters]);

  useEffect(() => {
    setGlobalFilterValue(prev => {
      if (prev !== globalFilter) {
        return globalFilter;
      }
      return prev;
    });
  }, [globalFilter]);

  // Enhanced column filter handler
  const handleColumnFiltersChange = (updaterOrValue: any) => {
    const newFilters =
      typeof updaterOrValue === "function"
        ? updaterOrValue(columnFilters)
        : updaterOrValue;

    setColumnFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Enhanced global filter handler
  const handleGlobalFilterChange = (updaterOrValue: any) => {
    const newValue =
      typeof updaterOrValue === "function"
        ? updaterOrValue(globalFilterValue)
        : updaterOrValue;

    setGlobalFilterValue(newValue);
    onGlobalFilterChange?.(newValue);
  };

  const handleSortingChange = (updaterOrValue: any) => {
    setSorting(prev => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(prev)
          : updaterOrValue;

      // If trying to remove sort (empty array) but we had a sort before, flip direction instead
      if (newSorting.length === 0 && prev.length > 0) {
        const lastSort = prev[0];
        return [
          {
            id: lastSort.id,
            desc: !lastSort.desc, // Flip the direction instead of removing
          },
        ];
      }

      return newSorting;
    });
  };

  const handlePaginationChange = (updaterOrValue: any) => {
    setPagination(prev => {
      const newPagination =
        typeof updaterOrValue === "function"
          ? updaterOrValue(prev)
          : updaterOrValue;

      // Only update if there's actually a change
      if (JSON.stringify(prev) !== JSON.stringify(newPagination)) {
        return newPagination;
      }
      return prev;
    });
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onChange",
    globalFilterFn: globalFilterFn,
    state: {
      sorting,
      pagination,
      columnFilters,
      globalFilter: globalFilterValue,
      columnSizing,
    },
  });

  // Expose table methods via ref
  useImperativeHandle(ref, () => ({
    getFilteredData: () =>
      table.getFilteredRowModel().rows.map(row => row.original),
    getFilteredRowCount: () => table.getFilteredRowModel().rows.length,
    getCurrentPageData: () => table.getRowModel().rows.map(row => row.original),
    getAllData: () => table.getCoreRowModel().rows.map(row => row.original),
    getTable: () => table,
  }));

  return (
    <div className={`w-full ${className}`}>
      <style>{`
        .table-row:hover .table-cell,
        .table-row:hover .table-cell > * {
          background-color: var(--row-hover-color) !important;
          transition: background-color 0.15s ease-in-out;
        }
        .table-cell.no-padding:hover > * {
          background-color: var(--cell-hover-color) !important;
          transition: background-color 0.15s ease-in-out;
        }
        .table-cell:not(.no-padding):hover {
          background-color: var(--cell-hover-color, var(--row-hover-color)) !important;
          transition: background-color 0.15s ease-in-out;
        }
        .table-cell,
        .table-cell > * {
          transition: background-color 0.15s ease-in-out;
        }
        .table-cell.no-padding {
          height: 48px !important;
          padding: 0 !important;
        }
      `}</style>
      <div className="w-full max-h-[calc(100vh-200px)] overflow-y-auto border border-gray-300 bg-white rounded-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="px-4 py-3 bg-gray-100 sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr
                key={headerGroup.id}
                className="text-left text-gray-500 border-b"
              >
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    className="p-3 font-medium"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="flex flex-col">
                            {header.column.getIsSorted() === "asc" ? (
                              <Icon icon="chevronUp" className="w-3 h-3" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <Icon icon="chevronDown" className="w-3 h-3" />
                            ) : (
                              <Icon
                                icon="sort"
                                className="w-3 h-3 opacity-50"
                              />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="cursor-pointer">
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="text-center p-4">
                  Loading...
                </td>
              </tr>
            )}

            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center p-4">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!isLoading &&
              data.length > 0 &&
              table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center p-4">
                    {emptyMessage}
                  </td>
                </tr>
              )}

            {!isLoading &&
              table.getRowModel().rows.length > 0 &&
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="table-row text-black/60 border-b cursor-pointer h-12"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map(cell => {
                    // Get custom cell props including fillColour and getStatusColor
                    const cellMeta = cell.column.columnDef.meta as
                      | {
                          fillColour?: string;
                          getStatusColor?: (
                            value: any,
                            row: any
                          ) =>
                            | string
                            | {
                                standard?: string;
                                rowHover?: string;
                                cellHover?: string;
                              }
                            | undefined;
                          hoverColors?: {
                            standard?: string;
                            rowHover?: string;
                            cellHover?: string;
                          };
                          noPadding?: boolean;
                        }
                      | undefined;

                    // Determine cell background color
                    let backgroundColor: string | undefined;

                    let dynamicHoverColors;
                    if (cellMeta?.getStatusColor) {
                      // Use dynamic color based on cell value
                      const statusResult = cellMeta.getStatusColor(
                        cell.getValue(),
                        row.original
                      );

                      // Check if result is an object with hover states or just a string
                      if (
                        typeof statusResult === "object" &&
                        statusResult !== null &&
                        statusResult.standard
                      ) {
                        dynamicHoverColors = statusResult;
                        backgroundColor = statusResult.standard;
                      } else {
                        backgroundColor = statusResult as string;
                      }
                    } else if (cellMeta?.fillColour) {
                      // Use static color
                      backgroundColor = cellMeta.fillColour;
                    }

                    // Prefer dynamic hover colors from getStatusColor, then static
                    const hoverColors =
                      dynamicHoverColors || cellMeta?.hoverColors;
                    const standardColor =
                      backgroundColor || hoverColors?.standard || "transparent";

                    // For row hover: use custom color if specified, otherwise default gray
                    const rowHoverColor = hoverColors?.rowHover || "#e5e7eb"; // gray-200
                    const cellHoverColor =
                      hoverColors?.cellHover || rowHoverColor;

                    const cellStyle = {
                      backgroundColor: standardColor,
                      "--row-hover-color": rowHoverColor,
                      "--cell-hover-color": cellHoverColor,
                      width: cell.column.getSize(),
                    } as React.CSSProperties;

                    return (
                      <td
                        key={cell.id}
                        className={`table-cell ${cellMeta?.noPadding ? "p-0 h-full no-padding" : "p-3"}`}
                        style={cellStyle}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showPagination && data.length > 0 && (
        <Pagination
          table={table}
          totalCount={data.length}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
});

export default Table;
