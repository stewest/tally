"use client";

import React from "react";
import { isLocalAuthBypassEnabled } from "@/utils/auth-mode";
import { ClerkSessionAuthProvider } from "./ClerkSessionAuthProvider";
import { LOCAL_SESSION, SessionAuthContext } from "./SessionAuthContext";

export function SessionAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLocalAuthBypassEnabled()) {
    return (
      <SessionAuthContext.Provider value={LOCAL_SESSION}>
        {children}
      </SessionAuthContext.Provider>
    );
  }

  return <ClerkSessionAuthProvider>{children}</ClerkSessionAuthProvider>;
}
