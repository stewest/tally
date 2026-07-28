"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { UserProfile, useUser as useClerkUser } from "@clerk/nextjs";
import { useUpdateProfile } from "@/hooks/useAuth";
import { useUser } from "@/context/UserContext";
import { usePageLayout } from "@/hooks/usePageLayout";

export default function ProfilePage() {
  usePageLayout(
    useMemo(() => ({ breadcrumbs: [{ label: "My Profile" }] }), [])
  );
  const { user: clerkUser } = useClerkUser();
  const { currentUser } = useUser();
  const { mutate: syncProfile } = useUpdateProfile();
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (!clerkUser || !currentUser) return;

    const clerkFirstName = clerkUser.firstName ?? "";
    const clerkLastName = clerkUser.lastName ?? "";
    const clerkEmail = clerkUser.primaryEmailAddress?.emailAddress ?? "";

    const snapshotKey = `${clerkFirstName}|${clerkLastName}|${clerkEmail}`;

    if (!lastSyncedRef.current) {
      lastSyncedRef.current = snapshotKey;
      return;
    }

    if (snapshotKey === lastSyncedRef.current) return;

    const dbFirstName = currentUser.profile.firstName ?? "";
    const dbLastName = currentUser.profile.lastName ?? "";
    const dbEmail = currentUser.profile.email ?? "";

    if (
      clerkFirstName === dbFirstName &&
      clerkLastName === dbLastName &&
      clerkEmail === dbEmail
    ) {
      lastSyncedRef.current = snapshotKey;
      return;
    }

    lastSyncedRef.current = snapshotKey;
    syncProfile({
      firstName: clerkFirstName,
      lastName: clerkLastName,
      email: clerkEmail,
    });
  }, [
    clerkUser?.firstName,
    clerkUser?.lastName,
    clerkUser?.primaryEmailAddress?.emailAddress,
    clerkUser,
    currentUser,
    syncProfile,
  ]);

  return (
    <div className="w-full">
      <UserProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox:
              "w-full !max-w-full shadow-none border border-gray-200 rounded-xl max-h-[400px]",
            pageScrollBox: "max-h-[400px]",
          },
        }}
      />
    </div>
  );
}
