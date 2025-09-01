/**
 * Advanced cache management hooks for email data
 * Demonstrates React Query v5 cache patterns
 */

import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

export function useEmailCache() {
  const queryClient = useQueryClient();

  // Prefetch multiple emails in parallel
  const prefetchEmails = (emailIds: string[]) => {
    const utils = (trpc as any).useUtils();

    // Prefetch all emails in parallel
    emailIds.forEach((id) => {
      utils.emails.getEmail.prefetch(
        { id },
        {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
        }
      );
    });
  };

  // Get cached email without triggering a request
  const getCachedEmail = (emailId: string) => {
    return queryClient.getQueryData(
      (trpc as any).emails.getEmail.getQueryKey({ id: emailId })
    );
  };

  // Check if email data is cached and fresh
  const isEmailCached = (emailId: string) => {
    const queryState = queryClient.getQueryState(
      (trpc as any).emails.getEmail.getQueryKey({ id: emailId })
    );

    return {
      isCached: !!queryState,
      isFresh:
        !!queryState && queryState.dataUpdatedAt > Date.now() - 5 * 60 * 1000,
      isStale: !!queryState && (queryState as any).isStale,
    };
  };

  // Prime cache with known data (useful after mutations)
  const primeEmailCache = (emailId: string, emailData: any) => {
    queryClient.setQueryData(
      (trpc as any).emails.getEmail.getQueryKey({ id: emailId }),
      emailData
    );
  };

  // Invalidate specific email cache
  const invalidateEmail = (emailId: string) => {
    queryClient.invalidateQueries({
      queryKey: (trpc as any).emails.getEmail.getQueryKey({ id: emailId }),
    });
  };

  // Invalidate all email-related caches
  const invalidateAllEmails = () => {
    queryClient.invalidateQueries({
      queryKey: ["emails"], // This will match all email-related queries
    });
  };

  // Remove email from cache (useful after deletion)
  const removeEmailFromCache = (emailId: string) => {
    queryClient.removeQueries({
      queryKey: (trpc as any).emails.getEmail.getQueryKey({ id: emailId }),
    });
  };

  // Get cache statistics for debugging
  const getCacheStats = () => {
    const queries = queryClient.getQueryCache().getAll();
    const emailQueries = queries.filter((query) =>
      query.queryKey.includes("emails")
    );

    return {
      totalQueries: queries.length,
      emailQueries: emailQueries.length,
      freshQueries: emailQueries.filter((q) => !q.isStale()).length,
      staleQueries: emailQueries.filter((q) => q.isStale()).length,
      errorQueries: emailQueries.filter((q) => q.state.error).length,
    };
  };

  // Preload critical data for dashboard
  const preloadDashboard = () => {
    const utils = (trpc as any).useUtils();

    // Preload user info
    utils.auth.me.prefetch();

    // Preload emails list
    utils.emails.getEmails.prefetch();

    // Preload tier limits
    utils.emails.getTierLimits.prefetch();
  };

  return {
    prefetchEmails,
    getCachedEmail,
    isEmailCached,
    primeEmailCache,
    invalidateEmail,
    invalidateAllEmails,
    removeEmailFromCache,
    getCacheStats,
    preloadDashboard,
  };
}
