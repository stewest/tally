"use client";

import React, { createContext, useContext } from "react";
import { CurrentUser } from "@/server/authentication";
import { Membership, Role } from "../../db/schema";
import { useCurrentUser } from "@/hooks/useAuth";
import { useSessionAuth } from "@/context/SessionAuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface UserContextProps {
  currentUser: CurrentUser | null;
  userRole: Role;
  isAdmin: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  memberships: Membership[];
  error: Error | null;
}

interface UserProviderProps {
  children: React.ReactNode;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const { isLoaded: isSessionLoaded, isSignedIn } = useSessionAuth();
  const { data: currentUser, isFetching, isPending, error } = useCurrentUser();
  const queryClient = useQueryClient();
  const isLoading =
    !isSessionLoaded ||
    (!!isSignedIn && (isFetching || (isPending && !error)));

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  };

  const user = currentUser ?? null;
  const userRole = user?.role ?? ("member" as Role);

  const isAdminUser = user?.role === "admin" || user?.role === "super_admin";

  return (
    <UserContext.Provider
      value={{
        currentUser: user,
        userRole,
        memberships: user?.memberships ?? [],
        isLoading,
        isAdmin: isAdminUser,
        refreshUser,
        error: error ?? null,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
