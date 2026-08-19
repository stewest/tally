import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { InviteBanner } from "@/components/auth/InviteBanner";
import { isLocalAuthBypassEnabled } from "@/utils/auth-mode";

export default function SignUpPage() {
  if (isLocalAuthBypassEnabled()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Suspense>
        <InviteBanner />
      </Suspense>
      <SignUp />
    </div>
  );
}
