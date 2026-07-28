import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/components/ui/Toast";
import axios from "axios";

export const useCurrentUser = () => {
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await axios.get<GetCurrentUserResponse>(
        "/api/auth/current-user"
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch current user");
      }
      return response.data.data;
    },
    enabled: isLoaded && !!isSignedIn,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (params: UpdateProfileRequest) => {
      const response = await axios.put<UpdateProfileResponse>(
        "/api/profile",
        params
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update profile");
      }
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate the current user query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      addToast("Profile updated successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to update profile", "error");
    },
  });
};

export const useUpdateProfilePicture = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await axios.put<UpdateProfilePictureResponse>(
        "/api/profile/picture",
        { fileId } as UpdateProfilePictureRequest
      );
      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to update profile picture"
        );
      }
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate the current user query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      addToast("Profile picture updated successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to update profile picture", "error");
    },
  });
};

export const useSetCurrentOrganisation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organisationId: string | null) => {
      const response = await axios.put<SetCurrentOrganisationResponse>(
        "/api/profile/current-organisation",
        { organisationId } as SetCurrentOrganisationRequest
      );
      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to set current organisation"
        );
      }
    },
    onSuccess: () => {
      // Invalidate the current user query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};

export const useAuthActions = () => {
  const queryClient = useQueryClient();

  const refreshUserData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  };

  return {
    refreshUserData,
  };
};
