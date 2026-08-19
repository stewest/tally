import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { InviteBanner } from "@/components/auth/InviteBanner";
import { isLocalAuthBypassEnabled } from "@/utils/auth-mode";

export default function SignInPage() {
  if (isLocalAuthBypassEnabled()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Suspense>
        <InviteBanner />
      </Suspense>
      <h1 className="text-2xl font-bold">Welcome to TALLY, your personal finance app.</h1>
      <SignIn />
    </div>
  );
}
