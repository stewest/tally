import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { Role } from "../../db/schema";
import axios from "axios";

export const useUsersForOrganisation = (organisationId: string) => {
  return useQuery({
    queryKey: ["usersForOrganisation", organisationId],
    queryFn: async () => {
      const response = await axios.get<GetUserProfilesForOrganisationResponse>(
        `/api/organisations/${organisationId}/users`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch users");
      }
      return response.data.data || [];
    },
    enabled: !!organisationId && organisationId.trim() !== "", // Only run if organisationId exists and is not empty
  });
};

export const useInvitesForOrganisation = (organisationId: string) => {
  return useQuery({
    queryKey: ["invitesForOrganisation", organisationId],
    queryFn: async () => {
      const response = await axios.get<GetInvitesForOrganisationResponse>(
        `/api/organisations/${organisationId}/invites`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch invites");
      }
      return response.data.data || [];
    },
    enabled: !!organisationId,
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (params: InviteUserRequest) => {
      const response = await axios.post<InviteUserResponse>(
        "/api/users/invite",
        params
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to invite user");
      }
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["invitesForOrganisation", variables.organisationId],
      });
      addToast("User invited successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to invite user", "error");
    },
  });
};

export const useCancelInvite = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await axios.delete<CancelInviteResponse>(
        `/api/invites/${inviteId}`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to cancel invite");
      }
    },
    onSuccess: () => {
      // Invalidate all invite queries
      queryClient.invalidateQueries({
        queryKey: ["invitesForOrganisation"],
      });
      addToast("Invite cancelled successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to cancel invite", "error");
    },
  });
};

export const useResendInvite = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await axios.post<ResendInviteResponse>(
        `/api/invites/${inviteId}`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to resend invite");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["invitesForOrganisation"],
      });
      addToast("Invite resent successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to resend invite", "error");
    },
  });
};

export const useAcceptInvite = () => {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ token }: { token: string; userId: string }) => {
      const response = await axios.put<AcceptInviteResponse>(
        "/api/users/invite",
        { token }
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to accept invitation");
      }
      return response.data.data;
    },
    onSuccess: () => {
      addToast(
        "Invitation accepted successfully! Welcome to the team!",
        "success"
      );
    },
    onError: (error: Error) => {
      if (error.message.includes("already has membership")) {
        addToast("You are already a member of this organization", "error");
      } else if (
        error.message.includes("expired") ||
        error.message.includes("Invalid")
      ) {
        addToast("This invitation link is invalid or has expired", "error");
      } else {
        addToast(error.message || "Failed to accept invitation", "error");
      }
    },
  });
};

export const useGetInviteByToken = (token: string) => {
  return useQuery({
    queryKey: ["inviteByToken", token],
    queryFn: async () => {
      const response = await axios.get<GetInviteByTokenResponse>(
        `/api/invites/by-token?token=${encodeURIComponent(token)}`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch invite");
      }
      return response.data.data ?? null;
    },
    enabled: !!token,
    retry: false,
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({
      membershipId,
      newRole,
    }: {
      membershipId: string;
      newRole: Role;
    }) => {
      const response = await axios.put<UpdateUserRoleResponse>(
        `/api/memberships/${membershipId}`,
        { newRole } as UpdateUserRoleRequest
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update user role");
      }
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate users query to refresh the table
      queryClient.invalidateQueries({
        queryKey: ["usersForOrganisation"],
      });
      addToast("User role updated successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to update user role", "error");
    },
  });
};

export const useRemoveUser = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const response = await axios.delete<RemoveUserResponse>(
        `/api/memberships/${membershipId}`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to remove user");
      }
    },
    onSuccess: () => {
      // Invalidate users query to refresh the table
      queryClient.invalidateQueries({
        queryKey: ["usersForOrganisation"],
      });
      addToast("User removed successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to remove user", "error");
    },
  });
};
