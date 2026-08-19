"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { UserProfile, useUser as useClerkUser } from "@clerk/nextjs";
import { useUpdateProfile } from "@/hooks/useAuth";
import { useUser } from "@/context/UserContext";
import { usePageLayout } from "@/hooks/usePageLayout";
import { isLocalAuthBypassEnabled } from "@/utils/auth-mode";

function LocalProfileCard() {
  const { currentUser } = useUser();
  const displayName =
    [currentUser?.profile.firstName, currentUser?.profile.lastName]
      .filter(Boolean)
      .join(" ") || "Local Developer";

  return (
    <div className="w-full max-w-xl border border-gray-200 rounded-xl p-6 bg-white">
      <h2 className="text-lg font-medium text-gray-900">{displayName}</h2>
      <p className="mt-1 text-sm text-gray-500">
        {currentUser?.profile.email ?? "local@localhost"}
      </p>
      <p className="mt-4 text-sm text-gray-500">
        Signed in with the local development bypass. Add real Clerk keys to
        manage account settings here.
      </p>
    </div>
  );
}

function ClerkProfilePage() {
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

export default function ProfilePage() {
  usePageLayout(
    useMemo(() => ({ breadcrumbs: [{ label: "My Profile" }] }), [])
  );

  if (isLocalAuthBypassEnabled()) {
    return <LocalProfileCard />;
  }

  return <ClerkProfilePage />;
}
