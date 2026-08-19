"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { useSessionAuth } from "@/context/SessionAuthContext";

export function useSupabaseClient() {
  const { getAccessToken } = useSessionAuth();

  return useMemo(() => {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        async accessToken() {
          return getAccessToken();
        },
      }
    );
  }, [getAccessToken]);
}
