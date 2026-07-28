"use client";

import React, { useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { usePageLayout } from "@/hooks/usePageLayout";
import {
  useUsersForOrganisation,
  useInvitesForOrganisation,
  useInviteUser,
  useCancelInvite,
  useResendInvite,
  useUpdateUserRole,
  useRemoveUser,
} from "@/hooks/useUsers";
import Modal from "@/components/Modal";
import Button from "@/components/buttons/Button";
import { Icon } from "@/components/ui/Icon";
import UserTable from "@/components/users/UserTable";
import UserInviteForm, {
  UserInviteFormValues,
} from "@/components/users/UserInviteForm";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Role } from "@db/schema";

export default function UserManagementPage() {
  usePageLayout(
    useMemo(
      () => ({
        breadcrumbs: [
          { label: "Organisation Settings", path: "/organisation-settings" },
          { label: "User Management" },
        ],
      }),
      []
    )
  );

  const { currentUser } = useUser();
  const organisationId = currentUser?.organisation?.id || "";

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Data queries
  const { data: users = [], isLoading: usersLoading } =
    useUsersForOrganisation(organisationId);
  const { data: invites = [], isLoading: invitesLoading } =
    useInvitesForOrganisation(organisationId);

  // Mutations
  const inviteUserMutation = useInviteUser();
  const cancelInviteMutation = useCancelInvite();
  const resendInviteMutation = useResendInvite();
  const updateUserRoleMutation = useUpdateUserRole();
  const removeUserMutation = useRemoveUser();

  const isLoading = usersLoading || invitesLoading;

  const handleInviteUser = async (data: UserInviteFormValues) => {
    if (!organisationId) return;

    try {
      await inviteUserMutation.mutateAsync({
        email: data.email,
        role: data.role as Role,
        organisationId,
      });
      setIsInviteModalOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInviteMutation.mutateAsync(inviteId);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      await resendInviteMutation.mutateAsync(inviteId);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleUpdateUserRole = async (membershipId: string, newRole: Role) => {
    try {
      await updateUserRoleMutation.mutateAsync({ membershipId, newRole });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleRemoveUser = async (membershipId: string) => {
    try {
      await removeUserMutation.mutateAsync(membershipId);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // This page is now protected by the RouteProtection component
  // No need for individual page-level checks

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage team members and their roles in your organization.
          </p>
        </div>
        <PermissionGate requiredRole={Role.Admin}>
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <Icon icon="plus" className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </PermissionGate>
      </div>

      <UserTable
        users={users}
        invites={invites}
        isLoading={isLoading}
        onCancelInvite={handleCancelInvite}
        onResendInvite={handleResendInvite}
        onUpdateUserRole={handleUpdateUserRole}
        onRemoveUser={handleRemoveUser}
      />

      {isInviteModalOpen && (
        <Modal
          title="Invite New User"
          onClose={() => setIsInviteModalOpen(false)}
        >
          <UserInviteForm
            onSubmit={handleInviteUser}
            isSubmitting={inviteUserMutation.isPending}
            onCancel={() => setIsInviteModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
