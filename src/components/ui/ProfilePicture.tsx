"use client";

import React from "react";
import { UserAvatar } from "@clerk/nextjs";
import { isLocalAuthBypassEnabled } from "@/utils/auth-mode";

interface ProfilePictureProps {
  alt?: string;
  size?: "small" | "medium" | "large" | "xl";
  className?: string;
}

const sizeClasses = {
  small: "w-8 h-8",
  medium: "w-10 h-10",
  large: "w-16 h-16",
  xl: "w-24 h-24",
};

function LocalAvatar({
  sizeClass,
  className,
}: {
  sizeClass: string;
  className: string;
}) {
  return (
    <div
      className={`${sizeClass} ${className} rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-medium`}
    >
      L
    </div>
  );
}

export function ProfilePicture({
  size = "medium",
  className = "",
}: ProfilePictureProps) {
  const sizeClass = sizeClasses[size];

  if (isLocalAuthBypassEnabled()) {
    return <LocalAvatar sizeClass={sizeClass} className={className} />;
  }

  return (
    <div className={`${sizeClass} ${className}`}>
      <UserAvatar
        rounded
        appearance={{
          elements: {
            avatarBox: "w-full h-full",
          },
        }}
      />
    </div>
  );
}
