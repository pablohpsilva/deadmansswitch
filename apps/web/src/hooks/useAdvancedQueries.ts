/**
 * Advanced React Query patterns for complex data fetching scenarios
 */

import { useQuery, useQueries } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

// Parallel queries for dashboard data
export function useDashboardData() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["emails"],
        queryFn: () => trpc.emails.getEmails.fetch(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
      {
        queryKey: ["tier-limits"],
        queryFn: () => trpc.emails.getTierLimits.fetch(),
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
      },
      {
        queryKey: ["user-profile"],
        queryFn: () => trpc.auth.me.fetch(),
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
      },
    ],
  });

  const [emailsQuery, tierQuery, userQuery] = results;

  return {
    emails: emailsQuery.data,
    emailsLoading: emailsQuery.isLoading,
    emailsError: emailsQuery.error,

    tierLimits: tierQuery.data,
    tierLoading: tierQuery.isLoading,
    tierError: tierQuery.error,

    user: userQuery.data,
    userLoading: userQuery.isLoading,
    userError: userQuery.error,

    // Combined loading state
    isLoading:
      emailsQuery.isLoading || tierQuery.isLoading || userQuery.isLoading,

    // All data loaded successfully
    isReady:
      emailsQuery.isSuccess && tierQuery.isSuccess && userQuery.isSuccess,

    // Any errors
    hasErrors: !!emailsQuery.error || !!tierQuery.error || !!userQuery.error,
  };
}

// Dependent queries - fetch email details based on selected email
export function useEmailWithDetails(emailId?: string) {
  // First query: Get email basic info
  const emailQuery = useQuery({
    queryKey: ["emails", emailId],
    queryFn: () => trpc.emails.getEmail.fetch({ id: emailId! }),
    enabled: !!emailId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Dependent query: Get related user data if email exists
  const userDataQuery = useQuery({
    queryKey: ["user-data", emailQuery.data?.id],
    queryFn: async () => {
      // This could fetch additional user context for the email
      return {
        lastCheckIn: new Date(),
        emailCount: 5,
        // Other related data
      };
    },
    enabled: !!emailQuery.data,
    staleTime: 2 * 60 * 1000,
  });

  return {
    email: emailQuery.data,
    emailLoading: emailQuery.isLoading,
    emailError: emailQuery.error,

    userData: userDataQuery.data,
    userDataLoading: userDataQuery.isLoading,

    // Combined states
    isLoading: emailQuery.isLoading || userDataQuery.isLoading,
    isReady:
      emailQuery.isSuccess &&
      (userDataQuery.isSuccess || !userDataQuery.isEnabled),
  };
}

// Infinite query for large email lists (if needed in future)
export function useInfiniteEmails() {
  const query = trpc.emails.getEmails.useInfiniteQuery(
    { limit: 10 }, // This would need to be implemented in the backend
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );

  return {
    ...query,
    emails: query.data?.pages.flatMap((page) => page.emails) || [],
  };
}

// Background sync for critical data
export function useBackgroundSync() {
  // Keep user auth status fresh
  const userSync = useQuery({
    queryKey: ["background-user-sync"],
    queryFn: () => trpc.auth.me.fetch(),
    refetchInterval: 5 * 60 * 1000, // Every 5 minutes
    staleTime: 0, // Always consider stale for background sync
    gcTime: 1 * 60 * 1000, // Short cache time
    refetchOnWindowFocus: false, // Prevent double requests
  });

  // Background email sync (less frequent)
  const emailSync = useQuery({
    queryKey: ["background-email-sync"],
    queryFn: () => trpc.emails.getEmails.fetch(),
    refetchInterval: 10 * 60 * 1000, // Every 10 minutes
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    userSyncStatus: userSync.status,
    emailSyncStatus: emailSync.status,
    lastUserSync: userSync.dataUpdatedAt,
    lastEmailSync: emailSync.dataUpdatedAt,
  };
}

// Smart prefetching based on user behavior
export function usePrefetchStrategies() {
  const utils = trpc.useUtils();

  // Prefetch likely next actions
  const prefetchEmailDetails = (emailId: string) => {
    utils.emails.getEmail.prefetch(
      { id: emailId },
      {
        staleTime: 5 * 60 * 1000,
      }
    );
  };

  // Prefetch for dashboard navigation
  const prefetchDashboard = () => {
    utils.emails.getEmails.prefetch(undefined, {
      staleTime: 5 * 60 * 1000,
    });

    utils.emails.getTierLimits.prefetch(undefined, {
      staleTime: 15 * 60 * 1000,
    });

    utils.auth.me.prefetch(undefined, {
      staleTime: 5 * 60 * 1000,
    });
  };

  // Prefetch on hover (for better UX)
  const prefetchOnHover = (action: "dashboard" | "email", id?: string) => {
    if (action === "dashboard") {
      prefetchDashboard();
    } else if (action === "email" && id) {
      prefetchEmailDetails(id);
    }
  };

  return {
    prefetchEmailDetails,
    prefetchDashboard,
    prefetchOnHover,
  };
}
