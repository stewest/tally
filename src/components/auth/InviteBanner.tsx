"use client";

import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

interface InviteBannerContentProps {
  visible?: boolean;
}

export const InviteBannerContent = ({
  visible = true,
}: InviteBannerContentProps) => {
  if (!visible) return null;

  return (
    <div className="w-full max-w-md rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-blue-700">
        <Icon icon="envelope" className="h-4 w-4" />
        <p className="text-sm font-medium">
          You've been invited to join an organisation
        </p>
      </div>
      <p className="mt-1 text-xs text-blue-600">
        Sign in or create an account to accept your invitation.
      </p>
    </div>
  );
};

export const InviteBanner = () => {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect_url") || "";
  const isInviteRedirect = redirectUrl.includes("/accept-invite");

  return <InviteBannerContent visible={isInviteRedirect} />;
};
