// This is a reusable component to show a skeleton loading state for sites, clients, proposals, or similar layout.

import React from "react";

interface PageSkeletonProps {
  /** Number of info cards to display in the grid */
  infoCardCount?: number;
  /** Whether to show the search bar skeleton */
  showSearch?: boolean;
  /** Number of filter dropdowns to display */
  filterCount?: number;
  /** Number of table columns to display */
  tableColumns?: number;
  /** Number of table rows to display */
  tableRows?: number;
  /** Whether to show pagination skeleton */
  showPagination?: boolean;
  /** Custom className for the container */
  className?: string;
}

// Individual skeleton components
const InfoCardSkeleton = () => (
  <div className="bg-white rounded-md p-4 max-h-24 shadow-sm animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-2 w-16"></div>
    <div className="h-4 bg-gray-200 rounded w-24"></div>
  </div>
);

const SearchSkeleton = () => (
  <div className="relative flex items-center w-full animate-pulse">
    <div className="border border-gray-300 bg-gray-100 rounded-md h-10 w-full"></div>
    <div className="absolute right-2 flex items-center gap-1">
      <div className="w-4 h-4 bg-gray-200 rounded"></div>
      <div className="w-4 h-4 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const FilterSkeleton = () => (
  <div className="w-full py-2 px-4 border border-gray-300 rounded-md bg-gray-100 h-10 animate-pulse"></div>
);

const TableSkeleton = ({
  columns = 5,
  rows = 10,
}: {
  columns?: number;
  rows?: number;
}) => (
  <div className="w-full border border-gray-300 bg-white rounded-sm animate-pulse">
    <div className="w-full border-collapse text-sm">
      {/* Table Header */}
      <div className="px-4 py-3 bg-gray-100 border-b">
        <div className="flex">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="flex-1 p-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex hover:bg-gray-50">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1 p-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PaginationSkeleton = () => (
  <div className="flex items-center justify-between p-4 animate-pulse">
    <div className="flex items-center gap-2">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
      <div className="h-8 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="flex items-center gap-2">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="flex gap-1">
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export default function PageSkeleton({
  infoCardCount = 4,
  showSearch = true,
  filterCount = 3,
  tableColumns = 5,
  tableRows = 10,
  showPagination = true,
  className = "",
}: PageSkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Info Cards Grid */}
      {infoCardCount > 0 && (
        <div
          className={`grid grid-cols-2 md:grid-cols-4 ${infoCardCount === 5 ? "md:grid-cols-5" : ""} gap-4`}
        >
          {Array.from({ length: infoCardCount }).map((_, index) => (
            <InfoCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Search Bar */}
      {showSearch && <SearchSkeleton />}

      {/* Filters */}
      {filterCount > 0 && (
        <div className="grid grid-cols-3 gap-3 text-sm md:w-1/2">
          {Array.from({ length: filterCount }).map((_, index) => (
            <FilterSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Table */}
      <TableSkeleton columns={tableColumns} rows={tableRows} />

      {/* Pagination */}
      {showPagination && <PaginationSkeleton />}
    </div>
  );
}

// Export individual skeleton components for more granular use
export {
  InfoCardSkeleton,
  SearchSkeleton,
  FilterSkeleton,
  TableSkeleton,
  PaginationSkeleton,
};
