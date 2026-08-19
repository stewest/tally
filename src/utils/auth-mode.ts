/**
 * Local-only Clerk bypass for the starter template.
 *
 * Enabled during `next dev` when there is no real Clerk publishable key.
 * Never enabled on Vercel or when NODE_ENV is production.
 */
export function isClerkConfigured(): boolean {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    process.env.CLERK_PUBLISHABLE_KEY ??
    "";
  return publishableKey.startsWith("pk_");
}

export function isLocalAuthBypassEnabled(): boolean {
  if (process.env.VERCEL) {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return !isClerkConfigured();
}
