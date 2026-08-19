import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isLocalAuthBypassEnabled } from "@/utils/auth-mode";

export default async function Home() {
  if (isLocalAuthBypassEnabled()) {
    return redirect("/dashboard");
  }

  const { userId } = await auth();

  if (userId) {
    return redirect("/dashboard");
  } else {
    return redirect("/sign-in");
  }
}
