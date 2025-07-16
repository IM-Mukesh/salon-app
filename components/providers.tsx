"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Optionally import ReactQueryDevtools only if available
let ReactQueryDevtools: React.FC<{ initialIsOpen?: boolean }> = () => null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ReactQueryDevtools =
    require("@tanstack/react-query-devtools").ReactQueryDevtools;
} catch {}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Optional: React Query Devtools for debugging */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
