"use client";

import React, { useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useUpdateOrganisation } from "@/hooks/useOrganisations";
import Button from "@/components/buttons/Button";
import { Icon } from "@/components/ui/Icon";
import { usePageLayout } from "@/hooks/usePageLayout";

export default function OrganisationSettingsPage() {
  usePageLayout(
    useMemo(() => ({ breadcrumbs: [{ label: "Organisation Settings" }] }), [])
  );
  const { currentUser } = useUser();
  const updateOrganisationMutation = useUpdateOrganisation();

  const [organisationName, setOrganisationName] = useState(
    currentUser?.organisation?.name || ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const originalName = currentUser?.organisation?.name || "";

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrganisationName(value);
    setHasChanges(value !== originalName);
  };

  const handleSave = async () => {
    if (!currentUser?.organisation?.id || !hasChanges) return;

    try {
      await updateOrganisationMutation.mutateAsync({
        organisationId: currentUser.organisation.id,
        name: organisationName.trim(),
      });
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleCancel = () => {
    setOrganisationName(originalName);
    setIsEditing(false);
    setHasChanges(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Organisation Settings
        </h1>
        <p className="text-gray-600">
          Manage your organisation's basic information and settings.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="organisation-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Organisation Name
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  id="organisation-name"
                  type="text"
                  value={organisationName}
                  onChange={handleNameChange}
                  disabled={!isEditing}
                  placeholder="Enter organisation name"
                  className={`w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none ${
                    !isEditing ? "bg-gray-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Icon icon="pencil" className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSave}
                    disabled={
                      !hasChanges || updateOrganisationMutation.isPending
                    }
                    loading={updateOrganisationMutation.isPending}
                  >
                    <Icon icon="check" className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateOrganisationMutation.isPending}
                  >
                    <Icon icon="times" className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {hasChanges && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              <Icon icon="exclamationTriangle" className="inline mr-2" />
              You have unsaved changes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
