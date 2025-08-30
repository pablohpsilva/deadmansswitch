/**
 * SSR-compatible providers with proper hydration
 * Handles server-client data synchronization
 */

"use client";

import {
  QueryClient,
  QueryClientProvider,
  HydrationBoundary,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { trpc, trpcClient } from "@/lib/trpc";

interface ProvidersSSRProps {
  children: React.ReactNode;
  dehydratedState?: any; // Dehydrated query state from server
}

export function ProvidersSSR({ children, dehydratedState }: ProvidersSSRProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR-optimized defaults
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: (failureCount, error) => {
              // Custom retry logic for better UX
              if (failureCount >= 3) return false;

              // Don't retry on 4xx errors (client errors)
              if (error instanceof Error && "status" in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) return false;
              }

              return true;
            },
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false, // Prevent unnecessary refetches
            refetchOnReconnect: true, // Refetch when connection is restored
            // SSR compatibility
            refetchOnMount: false, // Don't refetch on mount if we have data
          },
          mutations: {
            // Global mutation settings
            retry: false, // Don't retry mutations by default
          },
        },
      })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          {children}
          {/* React Query DevTools - only shows in development */}
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
          )}
        </HydrationBoundary>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

// Server-side query helper for SSR
export async function getServerSideQueries() {
  // This would be used in getServerSideProps or Server Components
  // to prefetch data on the server
  const queryClient = new QueryClient();

  // Example: Prefetch app stats for landing page
  await queryClient.prefetchQuery({
    queryKey: ["app-stats"],
    queryFn: async () => ({
      totalUsers: 12547,
      messagesDelivered: 8932,
      uptime: "99.9%",
      lastUpdated: new Date().toISOString(),
    }),
    staleTime: 5 * 60 * 1000,
  });

  return {
    dehydratedState: queryClient.getQueryData(["app-stats"]),
    queryClient,
  };
}
