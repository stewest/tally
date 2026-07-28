import { ClerkProvider } from "@clerk/nextjs";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Vercel Supabase Template",
  description: "The fastest way to manage your users",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className}>
      <body className="bg-white text-gray-900">
        <ClerkProvider>
          <Providers>
            <main>{children}</main>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
