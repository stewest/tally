"use server";

import { Role } from "@db/schema";
import { getCurrentUser } from "@/server/authentication";
import { deleteSession } from "@/server/chat/sessions";
import { hasRequiredRole } from "@/utils/permissions";

export async function deleteChatSessionAction(
  sessionId: string
): Promise<DeleteChatSessionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "You are not signed in." };
    }
    if (!user.organisation || !user.role) {
      return { success: false, error: "No organisation selected" };
    }
    if (!hasRequiredRole(user.role, Role.Member)) {
      return {
        success: false,
        error: "You do not have permission to delete this chat.",
      };
    }

    const deleted = await deleteSession(
      user.organisation.id,
      sessionId,
      user.profile.id
    );
    if (!deleted) {
      return { success: false, error: "Chat not found." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteChatSessionAction:", error);
    const message =
      error instanceof Error && error.message === "User not authenticated"
        ? "You are not signed in."
        : "Failed to delete chat";
    return { success: false, error: message };
  }
}
