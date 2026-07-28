"use server";

import { redirect } from "next/navigation";

export const signOutAction = async () => {
  return redirect("/sign-in");
};
