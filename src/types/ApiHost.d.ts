// API Host Response Types
import {
  Organisation,
  Profile,
  Membership,
  Role,
  InviteToken,
  File,
  InviteWithDetails,
} from "../../db/schema";
import { CurrentUser } from "@/server/authentication";

declare global {
  // Organisation API Responses
  interface GetOrganisationResponse {
    success: boolean;
    data?: Organisation;
    error?: string;
  }

  interface UpdateOrganisationRequest {
    name: string;
  }

  interface UpdateOrganisationResponse {
    success: boolean;
    data?: Organisation;
    error?: string;
  }

  interface GetMemberOrganisationsResponse {
    success: boolean;
    data?: Organisation[];
    error?: string;
  }

  interface CreateOrganisationRequest {
    name: string;
  }

  interface CreateOrganisationResponse {
    success: boolean;
    data?: {
      organisation: Organisation;
      membership: Membership;
    };
    error?: string;
  }

  // Authentication API Responses
  interface GetCurrentUserResponse {
    success: boolean;
    data?: CurrentUser;
    error?: string;
  }

  // Profile API Responses
  interface GetUserProfileResponse {
    success: boolean;
    data?: Profile;
    error?: string;
  }

  interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
  }

  interface UpdateProfileResponse {
    success: boolean;
    data?: Profile;
    error?: string;
  }

  interface SetCurrentOrganisationRequest {
    organisationId: string | null;
  }

  interface SetCurrentOrganisationResponse {
    success: boolean;
    error?: string;
  }

  interface UpdateProfilePictureRequest {
    fileId: string;
  }

  interface UpdateProfilePictureResponse {
    success: boolean;
    data?: Profile;
    error?: string;
  }

  interface GetUserProfilesForOrganisationResponse {
    success: boolean;
    data?: Array<{
      profile: Profile;
      membership: Membership;
    }>;
    error?: string;
  }

  // Users API Responses
  interface InviteUserRequest {
    email: string;
    role: Role;
    organisationId: string;
  }

  interface InviteUserResponse {
    success: boolean;
    data?: InviteToken;
    error?: string;
  }

  interface GetInvitesForOrganisationResponse {
    success: boolean;
    data?: InviteWithDetails[];
    error?: string;
  }

  interface AcceptInviteRequest {
    token: string;
  }

  interface AcceptInviteResponse {
    success: boolean;
    data?: Membership;
    error?: string;
  }

  interface GetInviteByTokenResponse {
    success: boolean;
    data?: {
      invite: InviteToken;
      organisation: Organisation;
    } | null;
    error?: string;
  }

  interface CancelInviteResponse {
    success: boolean;
    error?: string;
  }

  interface ResendInviteResponse {
    success: boolean;
    error?: string;
  }

  interface UpdateUserRoleRequest {
    newRole: Role;
  }

  interface UpdateUserRoleResponse {
    success: boolean;
    data?: Membership;
    error?: string;
  }

  interface RemoveUserResponse {
    success: boolean;
    error?: string;
  }

  interface GetUsersForOrganisationResponse {
    success: boolean;
    data?: Array<{
      profile: Profile;
      membership: Membership;
    }>;
    error?: string;
  }

  // Membership API Responses
  interface GetMembershipResponse {
    success: boolean;
    data?: Membership;
    error?: string;
  }

  interface GetUserMembershipsResponse {
    success: boolean;
    data?: Membership[];
    error?: string;
  }

  // Storage API Responses
  interface UploadFileResponse {
    success: boolean;
    data?: File;
    error?: string;
  }

  interface DownloadFileResponse {
    success: boolean;
    data?: Blob;
    error?: string;
  }

  interface UploadProfilePictureResponse {
    success: boolean;
    data?: File;
    error?: string;
  }

  // Email API Response (existing)
  interface SendEmailResponse {
    success: boolean;
    message?: string;
    error?: string;
  }

  // Brain chat (WF-CHAT)
  interface ChatHistoryMessage {
    role: "user" | "assistant";
    content: string;
  }

  interface ChatRequest {
    message: string;
    /** Prior turns (oldest first); must match `historySignature`. */
    history?: ChatHistoryMessage[];
    /** Server-issued HMAC over org-scoped history; required when history is non-empty. */
    historySignature?: string;
  }

  interface ChatResponse {
    success: boolean;
    data?: {
      reply: string;
      /** Updated transcript including the latest user + assistant turns. */
      history: ChatHistoryMessage[];
      /** Signature for the returned history (echo on the next request). */
      historySignature: string;
    };
    error?: string;
  }

}

// This export is needed to make this file a module
export { };
