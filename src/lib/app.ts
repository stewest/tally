export function getAppName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME || "TALLY";
}
