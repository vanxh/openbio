"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import { loggerLink } from "@trpc/client";
import { Elements as StripeElements } from "@stripe/react-stripe-js";
import superjson from "superjson";

import { getStripe } from "@/lib/stripe/client";
import { api } from "@/trpc/react";
import { endingLink } from "@/trpc/shared";
import { ThemeProvider } from "@/components/theme-provider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        endingLink(),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryStreamedHydration transformer={superjson}>
          <ThemeProvider>
            <StripeElements stripe={getStripe()} options={{}}>
              {children}
            </StripeElements>
          </ThemeProvider>
        </ReactQueryStreamedHydration>
      </QueryClientProvider>
    </api.Provider>
  );
}
