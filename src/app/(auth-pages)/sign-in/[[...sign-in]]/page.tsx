import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { InviteBanner } from "@/components/auth/InviteBanner";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Suspense>
        <InviteBanner />
      </Suspense>
      <h1 className="text-2xl font-bold">
        Welcome to the Vercel Supabase Template
      </h1>
      <SignIn />
    </div>
  );
}
