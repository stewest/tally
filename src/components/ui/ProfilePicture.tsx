"use client";

import React from "react";
import { UserAvatar } from "@clerk/nextjs";

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

export function ProfilePicture({
  size = "medium",
  className = "",
}: ProfilePictureProps) {
  const sizeClass = sizeClasses[size];

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
