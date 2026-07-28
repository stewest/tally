import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Client hooks
export function useMemberOrganisations() {
  return useQuery({
    queryKey: ["organisations"],
    queryFn: async () => {
      const response = await axios.get<GetMemberOrganisationsResponse>(
        "/api/organisations"
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch organisations");
      }
      return response.data.data || [];
    },
  });
}

export function useCreateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await axios.post<CreateOrganisationResponse>(
        "/api/organisations",
        { name } as CreateOrganisationRequest
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to create organisation");
      }
      return response.data.data?.organisation;
    },
    onSuccess: () => {
      // Invalidate organisation queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });
}

export function useUpdateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationId,
      name,
    }: {
      organisationId: string;
      name: string;
    }) => {
      const response = await axios.put<UpdateOrganisationResponse>(
        `/api/organisations/${organisationId}`,
        { name } as UpdateOrganisationRequest
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update organisation");
      }
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate organisation queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });
}

export function useGetOrganisation(organisationId: string) {
  return useQuery({
    queryKey: ["organisation", organisationId],
    queryFn: async () => {
      const response = await axios.get<GetOrganisationResponse>(
        `/api/organisations/${organisationId}`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch organisation");
      }
      return response.data.data;
    },
    enabled: !!organisationId,
  });
}
