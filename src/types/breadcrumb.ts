import type { IconType } from "../components/ui/Icon";

export interface BreadcrumbItem {
  label: string;
  path?: string;
  logo?: IconType;
}
