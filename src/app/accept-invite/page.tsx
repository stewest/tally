"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@/context/UserContext";
import { PageSpinner } from "@/components/Spinner";
import { useAcceptInvite, useGetInviteByToken } from "@/hooks/useUsers";
import { Icon } from "@/components/ui/Icon";
const getDefaultLandingPage = () => "/dashboard";
import { useQueryClient } from "@tanstack/react-query";

interface AcceptedInviteInfo {
  organisationName: string;
}

const AcceptInviteContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { currentUser, isLoading: isLoadingUser, refreshUser } = useUser();
  const [acceptedInvite, setAcceptedInvite] =
    useState<AcceptedInviteInfo | null>(null);
  const queryClient = useQueryClient();
  const prevSignedIn = useRef(isSignedIn);

  const token = searchParams?.get("token");

  const {
    data: inviteData,
    isLoading: isLoadingInvite,
    error: inviteError,
    refetch: refetchInvite,
  } = useGetInviteByToken(token || "");
  const acceptInviteMutation = useAcceptInvite();

  const redirectToAuth = (path: "/sign-in" | "/sign-up") => {
    const returnUrl = `/accept-invite?token=${token}`;
    router.push(`${path}?redirect_url=${encodeURIComponent(returnUrl)}`);
  };

  useEffect(() => {
    if (!isClerkLoaded) return;

    const justSignedIn = isSignedIn && !prevSignedIn.current;
    const signedInButNoUser = isSignedIn && !currentUser && !isLoadingUser;

    if (justSignedIn || signedInButNoUser) {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      if (token) {
        refetchInvite();
      }
    }

    prevSignedIn.current = isSignedIn;
  }, [isClerkLoaded, isSignedIn, currentUser, isLoadingUser, token, queryClient, refetchInvite]);

  const handleAcceptInvite = async () => {
    if (!token) return;

    if (!currentUser) {
      redirectToAuth("/sign-in");
      return;
    }

    acceptInviteMutation.mutate(
      { token, userId: currentUser.profile.id },
      {
        onSuccess: async () => {
          setAcceptedInvite({
            organisationName:
              inviteData?.organisation?.name ?? "the organisation",
          });

          await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

          setTimeout(() => {
            router.push(getDefaultLandingPage());
          }, 2000);
        },
      }
    );
  };

  if (acceptedInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <Icon icon="check" className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Welcome to the Team!
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              You have successfully joined{" "}
              <strong>{acceptedInvite.organisationName}</strong>.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Redirecting you to your home page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAuthSettling = !isClerkLoaded || (isSignedIn && !currentUser && isLoadingUser);

  if (isLoadingInvite || isAuthSettling) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <PageSpinner />
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <Icon icon="xmark" className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Invalid Invitation Link
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              The invitation link is invalid or missing.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/sign-in")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (inviteError || !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <Icon icon="xmark" className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Invitation Error
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              This invitation link is invalid or has expired.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/sign-in")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <Icon icon="user" className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              You're Invited!
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              You've been invited to join{" "}
              <strong>{inviteData.organisation?.name}</strong> as a{" "}
              <strong>{inviteData.invite.role}</strong>.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Please sign in or create an account to accept this invitation.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => redirectToAuth("/sign-in")}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </button>
              <button
                onClick={() => redirectToAuth("/sign-up")}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <Icon icon="user" className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            You're Invited!
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            You've been invited to join{" "}
            <strong>{inviteData.organisation?.name}</strong> as a{" "}
            <strong>{inviteData.invite.role}</strong>.
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={handleAcceptInvite}
              disabled={acceptInviteMutation.isPending}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {acceptInviteMutation.isPending ? (
                <>
                  <Icon icon="sync" className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </button>
            <button
              onClick={() => {
                router.push(getDefaultLandingPage());
              }}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <PageSpinner />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
