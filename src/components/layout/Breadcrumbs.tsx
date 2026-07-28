"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { useUser } from "@/context/UserContext";
import { Icon } from "../ui/Icon";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types/breadcrumb";

function BreadcrumbItem({ item }: { item: BreadcrumbItemType }) {
  const pillClass =
    "flex items-center gap-2 bg-gray-100 px-3 py-2 border border-gray-200 rounded-xl text-gray-900 text-sm";

  const content = (
    <>
      {item.logo && <Icon icon={item.logo} />}
      {item.label}
    </>
  );

  if (item.path) {
    return (
      <Link
        href={item.path}
        className={`${pillClass} hover:bg-gray-200 hover:border-gray-300 cursor-pointer`}
      >
        {content}
      </Link>
    );
  }

  return <div className={pillClass}>{content}</div>;
}

export default function Breadcrumbs() {
  const { breadcrumbs } = useBreadcrumb();
  const { currentUser } = useUser();

  const allItems = useMemo<BreadcrumbItemType[]>(() => {
    const orgItem: BreadcrumbItemType = {
      label: currentUser?.organisation?.name ?? "Organisation",
      path: "/dashboard",
    };
    return [orgItem, ...breadcrumbs];
  }, [breadcrumbs, currentUser?.organisation?.name]);

  return (
    <nav className="flex items-center gap-2">
      {allItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <BreadcrumbItem item={item} />
          {index < allItems.length - 1 && (
            <Icon icon="chevronRight" className="text-gray-400 text-xs" />
          )}
        </div>
      ))}
    </nav>
  );
}
