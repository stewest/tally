"use client";

import { useEffect } from "react";
import { useBreadcrumb } from "../context/BreadcrumbContext";
import type { BreadcrumbItem } from "../types/breadcrumb";

interface PageLayoutConfig {
  breadcrumbs?: BreadcrumbItem[];
}

export function usePageLayout(config: PageLayoutConfig): void {
  const { setBreadcrumbs, clearBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    if (config.breadcrumbs) {
      setBreadcrumbs(config.breadcrumbs);
    }
    return () => {
      clearBreadcrumbs();
    };
  }, [config.breadcrumbs, setBreadcrumbs, clearBreadcrumbs]);
}
