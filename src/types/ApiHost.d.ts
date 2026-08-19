// API Host Response Types
import {
  Organisation,
  Profile,
  Membership,
  Role,
  InviteToken,
  File,
  InviteWithDetails,
  Transaction,
  Budget,
  ChatSession,
  ChatMessage,
  BudgetPeriod,
  Insight,
  InsightCategory,
} from "../../db/schema";
import type { BudgetProgress, CategorySpendRow } from "@/lib/finance";
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

  interface ChatTraceSnapshot {
    elapsedMs: number;
    steps: Array<
      | { id: string; kind: "thought"; label: string }
      | {
          id: string;
          kind: "tool";
          tool: string;
          label: string;
          params?: string;
          result?: string;
          status: "running" | "done" | "error";
          durationMs?: number;
        }
    >;
  }

  interface ChatRequest {
    message: string;
    sessionId?: string;
  }

  interface ChatResponse {
    success: boolean;
    data?: {
      reply: string;
      sessionId: string;
      history: ChatHistoryMessage[];
    };
    error?: string;
  }

  type ChatStreamEvent =
    | { type: "session"; sessionId: string }
    | { type: "status"; phase: string }
    | { type: "thinking"; delta: string }
    | { type: "tool_call"; id: string; name: string; params?: string }
    | {
        type: "tool_result";
        id: string;
        name: string;
        ok: boolean;
        label?: string;
        result?: string;
      }
    | { type: "text"; delta: string }
    | {
        type: "done";
        reply: string;
        sessionId: string;
        history: ChatHistoryMessage[];
        title?: string;
        trace?: ChatTraceSnapshot;
      }
    | { type: "error"; message: string };

  interface ListChatSessionsResponse {
    success: boolean;
    data?: ChatSession[];
    error?: string;
  }

  interface CreateChatSessionResponse {
    success: boolean;
    data?: ChatSession;
    error?: string;
  }

  interface GetChatSessionResponse {
    success: boolean;
    data?: {
      session: ChatSession;
      messages: ChatMessage[];
    };
    error?: string;
  }

  interface RenameChatSessionRequest {
    title: string;
  }

  interface RenameChatSessionResponse {
    success: boolean;
    data?: ChatSession;
    error?: string;
  }

  interface DeleteChatSessionResponse {
    success: boolean;
    error?: string;
  }

  // Finance
  interface ListTransactionsResponse {
    success: boolean;
    data?: Transaction[];
    error?: string;
  }

  interface CreateTransactionRequest {
    occurredAt: string;
    description: string;
    amount: string;
    merchant?: string | null;
    category?: string | null;
    account?: string | null;
    notes?: string | null;
    currency?: string;
  }

  interface CreateTransactionResponse {
    success: boolean;
    data?: Transaction;
    error?: string;
  }

  interface UpdateTransactionRequest {
    occurredAt?: string;
    description?: string;
    amount?: string;
    merchant?: string | null;
    category?: string | null;
    account?: string | null;
    notes?: string | null;
    currency?: string;
  }

  interface UpdateTransactionResponse {
    success: boolean;
    data?: Transaction;
    error?: string;
  }

  interface DeleteTransactionResponse {
    success: boolean;
    error?: string;
  }

  interface ListBudgetsResponse {
    success: boolean;
    data?: Budget[];
    error?: string;
  }

  interface UpsertBudgetRequest {
    category: string;
    period: BudgetPeriod;
    amount: string;
    startsOn: string;
    endsOn?: string | null;
    notes?: string | null;
    currency?: string;
  }

  interface UpsertBudgetResponse {
    success: boolean;
    data?: Budget;
    error?: string;
  }

  interface UpdateBudgetRequest {
    category?: string;
    period?: BudgetPeriod;
    amount?: string;
    startsOn?: string;
    endsOn?: string | null;
    notes?: string | null;
    currency?: string;
  }

  interface UpdateBudgetResponse {
    success: boolean;
    data?: Budget;
    error?: string;
  }

  interface DeleteBudgetResponse {
    success: boolean;
    error?: string;
  }

  interface FinanceSummaryResponse {
    success: boolean;
    data?: {
      byCategory: CategorySpendRow[];
      budgets: BudgetProgress[];
    };
    error?: string;
  }

  interface ListInsightsResponse {
    success: boolean;
    data?: {
      insights: Insight[];
      hasTransactions: boolean;
    };
    error?: string;
  }

  interface QueueInsightsRequest {
    categories: InsightCategory[];
  }

  interface QueueInsightsResponse {
    success: boolean;
    data?: Insight[];
    error?: string;
  }

  interface DismissInsightResponse {
    success: boolean;
    error?: string;
  }

}

// This export is needed to make this file a module
export { };
