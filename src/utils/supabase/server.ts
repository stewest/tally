import { auth } from "@clerk/nextjs/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isLocalAuthBypassEnabled } from "@/utils/auth-mode";

/** User-scoped client (RLS enforced) using the publishable key + Clerk session. */
export const createClient = () => {
  if (isLocalAuthBypassEnabled()) {
    return createAdminClient();
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken() ?? null;
      },
    }
  );
};

/** Elevated server-only client (bypasses RLS). Never import from client code. */
export const createAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
};