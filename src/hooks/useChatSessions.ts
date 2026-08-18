import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/Toast";
import { deleteChatSessionAction } from "@/server/chat/session-actions";

export function useChatSessions() {
  return useQuery({
    queryKey: ["chatSessions"],
    queryFn: async () => {
      const response = await axios.get<ListChatSessionsResponse>(
        "/api/chat/sessions"
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch chat sessions");
      }
      return response.data.data || [];
    },
  });
}

export function useChatSession(sessionId: string | null) {
  return useQuery({
    queryKey: ["chatSession", sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("sessionId is required");
      }
      const response = await axios.get<GetChatSessionResponse>(
        `/api/chat/sessions/${sessionId}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Failed to fetch chat session");
      }
      return response.data.data;
    },
    enabled: !!sessionId,
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axios.post<CreateChatSessionResponse>(
        "/api/chat/sessions"
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Failed to create chat session");
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
    },
  });
}

export function useRenameChatSession() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await axios.patch<RenameChatSessionResponse>(
        `/api/chat/sessions/${id}`,
        { title } satisfies RenameChatSessionRequest
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Failed to rename chat");
      }
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
      queryClient.invalidateQueries({ queryKey: ["chatSession", variables.id] });
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to rename chat", "error");
    },
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteChatSessionAction(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete chat");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
      addToast("Chat deleted", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to delete chat", "error");
    },
  });
}
