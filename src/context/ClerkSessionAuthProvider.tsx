"use client";

import React from "react";
import { useAuth, useSession } from "@clerk/nextjs";
import { SessionAuthContext } from "./SessionAuthContext";

export function ClerkSessionAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { session } = useSession();

  return (
    <SessionAuthContext.Provider
      value={{
        isLoaded,
        isSignedIn: !!isSignedIn,
        getAccessToken: async () => session?.getToken() ?? null,
      }}
    >
      {children}
    </SessionAuthContext.Provider>
  );
}
