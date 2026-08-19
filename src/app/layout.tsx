import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { isLocalAuthBypassEnabled } from "@/utils/auth-mode";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: process.env.NEXT_PUBLIC_APP_NAME || "TALLY",
  description: "Track spending, budgets, and transactions",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const app = (
    <Providers>
      <main>{children}</main>
    </Providers>
  );

  if (!isLocalAuthBypassEnabled()) {
    const { ClerkProvider } = await import("@clerk/nextjs");
    return (
      <html lang="en" className={geistSans.className}>
        <body className="bg-white text-gray-900">
          <ClerkProvider>{app}</ClerkProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={geistSans.className}>
      <body className="bg-white text-gray-900">{app}</body>
    </html>
  );
}
