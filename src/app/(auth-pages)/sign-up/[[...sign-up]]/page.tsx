import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { InviteBanner } from "@/components/auth/InviteBanner";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Suspense>
        <InviteBanner />
      </Suspense>
      <SignUp />
    </div>
  );
}
