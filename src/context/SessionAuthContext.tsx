"use client";

import { createContext, useContext } from "react";

export type SessionAuth = {
  isLoaded: boolean;
  isSignedIn: boolean;
  getAccessToken: () => Promise<string | null>;
};

export const SessionAuthContext = createContext<SessionAuth | null>(null);

export const LOCAL_SESSION: SessionAuth = {
  isLoaded: true,
  isSignedIn: true,
  getAccessToken: async () => null,
};

export function useSessionAuth(): SessionAuth {
  const context = useContext(SessionAuthContext);
  if (!context) {
    throw new Error("useSessionAuth must be used within a SessionAuthProvider");
  }
  return context;
}
