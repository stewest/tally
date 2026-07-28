import React from "react";
import { Icon, IconType } from "./Icon";
import { InviteStatus, Role } from "../../../db/schema";

// Define additional variants for triggers
type ActiveStatus = "active" | "inactive";

// Define the tag variants we support in our simplified system
type TagVariant = Role | InviteStatus | ActiveStatus;

interface TagProps {
  variant: TagVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: IconType;
}

// Map variants to display text
export const getDisplayText = (variant: TagVariant): string => {
  switch (variant) {
    // Role
    case Role.SuperAdmin:
      return "Super Admin";
    case Role.Admin:
      return "Admin";
    case Role.Member:
      return "Member";

    // Invite statuses
    case InviteStatus.Pending:
      return "Pending";
    case InviteStatus.Accepted:
      return "Active";
    case InviteStatus.Expired:
      return "Expired";

    // Active status
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";

    default:
      return variant;
  }
};

// Get color styles for each tag variant
const getTagColor = (variant: TagVariant): string => {
  switch (variant) {
    // Roles
    case Role.SuperAdmin:
      return "bg-red-50 text-red-700 border-red-200";
    case Role.Admin:
      return "bg-red-50 text-red-700 border-red-200";
    case Role.Member:
      return "bg-blue-50 text-blue-700 border-blue-200";

    // Invite statuses
    case InviteStatus.Pending:
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case InviteStatus.Accepted:
      return "bg-green-50 text-green-700 border-green-200";
    case InviteStatus.Expired:
      return "bg-gray-50 text-gray-700 border-gray-200";

    // Active status
    case "active":
      return "bg-green-50 text-green-700 border-green-200";
    case "inactive":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getSizeStyles = (size: "sm" | "md" | "lg"): string => {
  switch (size) {
    case "sm":
      return "text-xs px-2 py-0.5";
    case "md":
      return "text-sm px-2.5 py-1";
    case "lg":
      return "text-base px-3 py-1.5";
    default:
      return "text-xs px-2 py-0.5";
  }
};

export default function Tag({
  variant,
  size = "sm",
  className,
  icon,
}: TagProps) {
  const baseStyles =
    "inline-flex items-center rounded-full border font-medium transition-colors";
  const colorStyles = getTagColor(variant);
  const sizeStyles = getSizeStyles(size);
  const displayText = getDisplayText(variant);

  const iconSizeClass = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  return (
    <span
      className={[baseStyles, colorStyles, sizeStyles, className].filter(Boolean).join(" ")}
    >
      {icon && (
        <Icon icon={icon} className={`mr-1.5 ${iconSizeClass}`} />
      )}
      {displayText}
    </span>
  );
}

// Export type for external use
export type { TagVariant };
