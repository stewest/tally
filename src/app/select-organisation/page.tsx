"use client";

import { useMemberOrganisations } from "@/hooks/useOrganisations";
import { useUser } from "@/context/UserContext";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/buttons/Button";
import { useSetCurrentOrganisation } from "@/hooks/useAuth";
import { PageSpinner } from "@/components/Spinner";
import { useQueryClient } from "@tanstack/react-query";

export default function SelectOrganisation() {
  const router = useRouter();
  const { currentUser, isLoading: isUserLoading, refreshUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: organisations, isLoading: isOrganisationsLoading } =
    useMemberOrganisations();

  const setCurrentOrganisationMutation = useSetCurrentOrganisation();

  const handleOrganisationSelect = async (organisationId: string) => {
    setIsSubmitting(true);
    try {
      await setCurrentOrganisationMutation.mutateAsync(organisationId);
      await queryClient.clear();
      await refreshUser();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error setting organisation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isOrganisationsLoading) {
    return <PageSpinner />;
  }

  if (!currentUser) {
    return redirect("/sign-in");
  }

  if (!organisations || organisations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Organisations
          </h2>
          <p className="text-gray-600 mb-6">
            You are not a member of any organisation.
          </p>
          <Button
            onClick={() => router.push("/create-organisation")}
            className="w-full"
          >
            Create Organisation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">
            Select Organisation
          </h2>
          <p className="text-gray-600 mt-1">
            Choose an organisation to continue
          </p>
        </div>
        <div className="p-6">
          <button
            onClick={() => router.push("/create-organisation")}
            className="text-sm text-gray-500 hover:text-blue-600 mb-4 block"
          >
            or Create a new organisation
          </button>
          <div className="grid gap-4">
            {organisations.map(org => (
              <div
                key={org.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedOrgId === org.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setSelectedOrgId(org.id)}
              >
                <div className="font-medium text-gray-900">{org.name}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-t border-gray-100">
          <Button
            onClick={() =>
              selectedOrgId && handleOrganisationSelect(selectedOrgId)
            }
            disabled={!selectedOrgId || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Selecting..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
