"use client";

import { PageSpinner } from "@/components/Spinner";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const AuthenticationCheck = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const { currentUser, isLoading, memberships, error } = useUser();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      router.push("/sign-in");
      return;
    }

    if (memberships.length === 0) {
      router.push("/create-organisation");
      return;
    }

    if (
      !currentUser.profile.currentOrganisationId ||
      !memberships.some(
        m => m.organisationId === currentUser.profile.currentOrganisationId
      )
    ) {
      router.push("/select-organisation");
      return;
    }

    setIsReady(true);
  }, [currentUser, isLoading, memberships, router, error]);

  if (isLoading || !isReady) {
    return <PageSpinner />;
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
};
