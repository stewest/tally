"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SessionAuthProvider } from "@/context/SessionAuthProvider";
import { UserProvider } from "@/context/UserContext";
import { BreadcrumbProvider } from "@/context/BreadcrumbContext";
import { ToastProvider } from "./ui/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionAuthProvider>
        <UserProvider>
          <BreadcrumbProvider>
            <ToastProvider>{children}</ToastProvider>
          </BreadcrumbProvider>
        </UserProvider>
      </SessionAuthProvider>
    </QueryClientProvider>
  );
}
