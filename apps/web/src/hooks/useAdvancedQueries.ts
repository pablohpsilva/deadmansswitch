/**
 * Advanced React Query patterns for complex data fetching scenarios
 */

import { useQuery } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";

// Parallel queries for dashboard data
export function useDashboardData() {
  // Use the React hooks instead of the vanilla client for better integration
  const emailsQuery = (trpc as any).emails.getEmails.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const tierQuery = (trpc as any).emails.getTierLimits.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const userQuery = (trpc as any).auth.me.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Remove this line since we're not using useQueries anymore

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

    // Combined loading state - only loading if ALL are loading and none have finished (success or error)
    isLoading:
      (emailsQuery.isLoading || tierQuery.isLoading || userQuery.isLoading) &&
      !emailsQuery.isSuccess &&
      !tierQuery.isSuccess &&
      !userQuery.isSuccess &&
      !emailsQuery.error &&
      !tierQuery.error &&
      !userQuery.error,

    // Ready when at least one critical query succeeds OR when all queries have finished (success or error)
    isReady:
      userQuery.isSuccess || // User data is most critical
      (!emailsQuery.isLoading && !tierQuery.isLoading && !userQuery.isLoading), // All finished loading

    // Any errors
    hasErrors: !!emailsQuery.error || !!tierQuery.error || !!userQuery.error,

    // Detailed status for debugging
    queryStatus: {
      emails: {
        loading: emailsQuery.isLoading,
        success: emailsQuery.isSuccess,
        error: !!emailsQuery.error,
        errorMsg: emailsQuery.error?.message,
      },
      tierLimits: {
        loading: tierQuery.isLoading,
        success: tierQuery.isSuccess,
        error: !!tierQuery.error,
        errorMsg: tierQuery.error?.message,
      },
      user: {
        loading: userQuery.isLoading,
        success: userQuery.isSuccess,
        error: !!userQuery.error,
        errorMsg: userQuery.error?.message,
      },
    },
  };
}

// Dependent queries - fetch email details based on selected email
export function useEmailWithDetails(emailId?: string) {
  // First query: Get email basic info
  const emailQuery = useQuery({
    queryKey: ["emails", emailId],
    queryFn: () => (trpcClient as any).emails.getEmail.query({ id: emailId! }),
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
  // This would require implementing infinite query support in the backend
  const query = useQuery({
    queryKey: ["emails-infinite"],
    queryFn: () => (trpcClient as any).emails.getEmails.query(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    ...query,
    emails: query.data || [],
  };
}

// Background sync for critical data
export function useBackgroundSync() {
  // Keep user auth status fresh
  const userSync = useQuery({
    queryKey: ["background-user-sync"],
    queryFn: () => (trpcClient as any).auth.me.query(),
    refetchInterval: 5 * 60 * 1000, // Every 5 minutes
    staleTime: 0, // Always consider stale for background sync
    gcTime: 1 * 60 * 1000, // Short cache time
    refetchOnWindowFocus: false, // Prevent double requests
  });

  // Background email sync (less frequent)
  const emailSync = useQuery({
    queryKey: ["background-email-sync"],
    queryFn: () => (trpcClient as any).emails.getEmails.query(),
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
  // For now, implement basic prefetching using React Query directly
  // In the future, this could be enhanced with more sophisticated strategies

  // Prefetch likely next actions
  const prefetchEmailDetails = (emailId: string) => {
    // This would require implementing proper prefetching
    console.log("Would prefetch email details for:", emailId);
  };

  // Prefetch for dashboard navigation
  const prefetchDashboard = () => {
    // This would require implementing proper prefetching
    console.log("Would prefetch dashboard data");
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
