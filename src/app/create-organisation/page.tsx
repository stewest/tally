"use client";

import { useCreateOrganisation } from "@/hooks/useOrganisations";
import { useUser } from "@/context/UserContext";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/buttons/Button";
import { useSetCurrentOrganisation } from "@/hooks/useAuth";
import { PageSpinner } from "@/components/Spinner";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateOrganisation() {
  const router = useRouter();
  const { currentUser, isLoading: isUserLoading, refreshUser } = useUser();
  const [organisationName, setOrganisationName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createOrganisationMutation = useCreateOrganisation();
  const setCurrentOrganisationMutation = useSetCurrentOrganisation();

  if (isUserLoading) {
    return <PageSpinner />;
  }

  if (!currentUser) {
    return redirect("/sign-in");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organisationName.trim()) {
      setError("Organisation name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newOrganisation =
        await createOrganisationMutation.mutateAsync(organisationName);
      await setCurrentOrganisationMutation.mutateAsync(
        newOrganisation?.id || ""
      );
      await queryClient.invalidateQueries();
      await refreshUser();
      router.replace("/dashboard");
    } catch (error) {
      console.error("Error creating organisation:", error);
      setError("Failed to create organisation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">
            Create Organisation
          </h2>
          <p className="text-gray-600 mt-1">
            Set up a new organisation to manage your projects
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="space-y-2">
              <label
                htmlFor="organisation-name"
                className="block text-sm font-medium text-gray-700"
              >
                Organisation Name
              </label>
              <input
                id="organisation-name"
                value={organisationName}
                onChange={e => setOrganisationName(e.target.value)}
                placeholder="Enter organisation name"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !organisationName.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Organisation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
