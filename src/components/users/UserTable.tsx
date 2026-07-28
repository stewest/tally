"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Table from "@/components/ui/Table";
import { Icon } from "@/components/ui/Icon";
import Tag from "@/components/ui/Tag";
import Modal from "@/components/Modal";
import Button from "@/components/buttons/Button";
import { useUser } from "@/context/UserContext";
import { createPortal } from "react-dom";
import RowActionMenu from "@/components/ui/RowActionMenu";
import type { RowActionItem } from "@/components/ui/RowActionMenu";
import {
  MembershipWithUser,
  InviteWithDetails,
  Role,
  InviteStatus,
} from "../../../db/schema";
import { formatDate } from "@/lib/utils";

interface UserTableData {
  id: string;
  membershipId?: string;
  userId?: string;
  name: string;
  email: string;
  role: Role;
  status: InviteStatus;
  joinedDate: string;
  isCurrentUser?: boolean;
}

interface UserTableProps {
  users: MembershipWithUser[];
  invites: InviteWithDetails[];
  isLoading?: boolean;
  onCancelInvite?: (inviteId: string) => void;
  onResendInvite?: (inviteId: string) => void;
  onUpdateUserRole?: (membershipId: string, newRole: Role) => void;
  onRemoveUser?: (membershipId: string) => void;
}

export default function UserTable({
  users,
  invites,
  isLoading = false,
  onCancelInvite,
  onResendInvite,
  onUpdateUserRole,
  onRemoveUser,
}: UserTableProps) {
  const { currentUser, isAdmin } = useUser();

  const [selectedInvite, setSelectedInvite] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    membershipId: string;
    name: string;
  } | null>(null);

  const [isInviteActionModalOpen, setIsInviteActionModalOpen] = useState(false);
  const [isRemoveUserModalOpen, setIsRemoveUserModalOpen] = useState(false);
  const [inviteActionType, setInviteActionType] = useState<"cancel" | "resend">(
    "cancel"
  );

  // Combine users and invites into table data
  const tableData: UserTableData[] = [
    ...users.map(userWithMembership => ({
      id: userWithMembership.membership.id,
      membershipId: userWithMembership.membership.id,
      userId: userWithMembership.profile.id,
      name:
        `${userWithMembership.profile.firstName || ""} ${userWithMembership.profile.lastName || ""}`.trim() ||
        "No name",
      email: userWithMembership.profile.email || "No email",
      role: userWithMembership.membership.role,
      status: InviteStatus.Accepted,
      joinedDate: formatDate(
        userWithMembership.membership.createdAt instanceof Date
          ? userWithMembership.membership.createdAt.toISOString()
          : userWithMembership.membership.createdAt
      ),
      isCurrentUser: userWithMembership.profile.id === currentUser?.profile?.id,
    })),
    ...invites.map(inviteWithDetails => ({
      id: inviteWithDetails.invite.id,
      name: inviteWithDetails.invite.email,
      email: inviteWithDetails.invite.email,
      role: inviteWithDetails.invite.role,
      status: inviteWithDetails.invite.status,
      joinedDate: formatDate(
        inviteWithDetails.invite.createdAt instanceof Date
          ? inviteWithDetails.invite.createdAt.toISOString()
          : inviteWithDetails.invite.createdAt
      ),
    })),
  ];

  const handleInviteAction = (
    id: string,
    email: string,
    action: "cancel" | "resend"
  ) => {
    setSelectedInvite({ id, email });
    setInviteActionType(action);
    setIsInviteActionModalOpen(true);
  };

  const handleRemoveUser = (membershipId: string, name: string) => {
    setSelectedUser({ membershipId, name });
    setIsRemoveUserModalOpen(true);
  };

  const handleConfirmInviteAction = () => {
    if (!selectedInvite) return;

    if (inviteActionType === "cancel" && onCancelInvite) {
      onCancelInvite(selectedInvite.id);
    } else if (inviteActionType === "resend" && onResendInvite) {
      onResendInvite(selectedInvite.id);
    }

    setIsInviteActionModalOpen(false);
    setSelectedInvite(null);
  };

  const handleConfirmRemoveUser = () => {
    if (!selectedUser || !onRemoveUser) return;

    onRemoveUser(selectedUser.membershipId);
    setIsRemoveUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = (membershipId: string, newRole: string) => {
    if (!onUpdateUserRole) return;
    onUpdateUserRole(membershipId, newRole as Role);
  };

  // Custom role selector component
  const RoleSelector = ({
    currentRole,
    membershipId,
    isCurrentUser,
  }: {
    currentRole: Role;
    membershipId: string;
    isCurrentUser: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);

    // Prevent changing own role from admin to member
    if (isCurrentUser) {
      return <Tag variant={currentRole} size="sm" />;
    }

    const roleOptions: Role[] = ["admin", "member"];

    // Calculate dropdown position
    const getDropdownPosition = () => {
      if (!buttonRef) return { top: 0, left: 0 };

      const rect = buttonRef.getBoundingClientRect();
      return {
        top: rect.bottom + window.scrollY + 4, // 4px gap
        left: rect.left + window.scrollX,
      };
    };

    const dropdownContent = isOpen && (
      <>
        {/* Backdrop to close dropdown */}
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

        {/* Dropdown menu */}
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-max"
          style={getDropdownPosition()}
        >
          {roleOptions.map(role => (
            <button
              key={role}
              onClick={() => {
                handleRoleChange(membershipId, role);
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
            >
              <Tag variant={role} size="sm" />
            </button>
          ))}
        </div>
      </>
    );

    return (
      <div className="relative">
        <button
          ref={setButtonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 cursor-pointer hover:opacity-80"
        >
          <Tag variant={currentRole} size="sm" />
          <Icon icon="chevronDown" className="w-3 h-3 text-gray-400" />
        </button>

        {/* Render dropdown in portal to escape table bounds */}
        {typeof window !== "undefined" &&
          dropdownContent &&
          createPortal(dropdownContent, document.body)}
      </div>
    );
  };

  const columns: ColumnDef<UserTableData>[] = [
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: true,
    },
    {
      accessorKey: "role",
      header: "Role",
      enableSorting: true,
      cell: ({ getValue, row }) => {
        const role = getValue() as Role;
        const user = row.original;

        // Show editable role select for accepted users if current user is admin
        if (
          isAdmin &&
          user.status === InviteStatus.Accepted &&
          user.membershipId
        ) {
          return (
            <RoleSelector
              currentRole={role}
              membershipId={user.membershipId}
              isCurrentUser={user.isCurrentUser || false}
            />
          );
        }

        return <Tag variant={role} size="sm" />;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return <Tag variant={status as InviteStatus} size="sm" />;
      },
    },
    {
      accessorKey: "joinedDate",
      header: "Joined Date",
      enableSorting: true,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        const items: RowActionItem[] = [];

        if (user.status !== InviteStatus.Accepted) {
          items.push({
            icon: "envelope",
            label: "Resend invite",
            onClick: () => handleInviteAction(user.id, user.email, "resend"),
          });
          items.push({
            icon: "times",
            label: "Cancel invite",
            onClick: () => handleInviteAction(user.id, user.email, "cancel"),
            destructive: true,
          });
        }

        if (
          isAdmin &&
          user.status === InviteStatus.Accepted &&
          user.membershipId &&
          !user.isCurrentUser
        ) {
          items.push({
            icon: "trash",
            label: "Remove user",
            onClick: () => handleRemoveUser(user.membershipId!, user.name),
            destructive: true,
          });
        }

        if (items.length === 0) return null;

        return (
          <div className="flex justify-end" onClick={e => e.stopPropagation()}>
            <RowActionMenu items={items} />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Table
        data={tableData}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No users found. Invite your first team member to get started."
        showPagination={false}
      />

      {isInviteActionModalOpen && (
        <Modal
          title={
            inviteActionType === "cancel" ? "Cancel Invite" : "Resend Invite"
          }
          onClose={() => setIsInviteActionModalOpen(false)}
        >
          <p className="text-sm text-gray-600 mb-4">
            {inviteActionType === "cancel"
              ? `Are you sure you want to cancel the invitation for ${selectedInvite?.email}?`
              : `Resend the invitation to ${selectedInvite?.email}?`}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInviteActionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmInviteAction}>
              {inviteActionType === "cancel" ? "Cancel Invite" : "Resend"}
            </Button>
          </div>
        </Modal>
      )}

      {isRemoveUserModalOpen && (
        <Modal
          title="Remove User"
          onClose={() => setIsRemoveUserModalOpen(false)}
        >
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to remove{" "}
            <strong>{selectedUser?.name}</strong> from the organisation? This
            action cannot be undone and they will lose access to all
            organisation data.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRemoveUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
              onClick={handleConfirmRemoveUser}
            >
              Remove User
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
