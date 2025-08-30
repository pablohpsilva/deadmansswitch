/**
 * Global application data hooks using React Query
 * Provides app-wide data like user session, configuration, stats, etc.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

export function useGlobalData() {
  const queryClient = useQueryClient();

  // User session data (cached globally)
  const userSession = trpc.auth.me.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true, // Important for auth state
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors (likely auth issues)
      if (error && "status" in error) {
        const status = (error as any).status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 2;
    },
  });

  // Tier limits (rarely change, cache longer)
  const tierLimits = trpc.emails.getTierLimits.useQuery(undefined, {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!userSession.data, // Only fetch if user is authenticated
  });

  // App configuration or stats (could be from API)
  const appStats = useQuery({
    queryKey: ["app-stats"],
    queryFn: async () => {
      // This could fetch real-time stats from your API
      // For now, return mock data
      return {
        totalUsers: 12547,
        messagesDelivered: 8932,
        uptime: "99.9%",
        lastUpdated: new Date(),
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Prefetch common data when user is authenticated
  const prefetchUserData = () => {
    if (userSession.data) {
      // Prefetch emails list
      queryClient.prefetchQuery({
        queryKey: ["emails"],
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  // Check authentication status
  const isAuthenticated = !!userSession.data && !userSession.error;
  const isLoading = userSession.isLoading;
  const authError = userSession.error;

  // Logout function that clears all cache
  const logout = () => {
    localStorage.removeItem("auth_token");
    queryClient.clear(); // Clear all cached data
    window.location.href = "/"; // Hard redirect to clear state
  };

  return {
    // User data
    user: userSession.data,
    userLoading: userSession.isLoading,
    userError: userSession.error,
    refetchUser: userSession.refetch,

    // Tier information
    tierLimits: tierLimits.data,
    tierLoading: tierLimits.isLoading,

    // App stats
    appStats: appStats.data,
    statsLoading: appStats.isLoading,

    // Utilities
    isAuthenticated,
    isLoading,
    authError,
    logout,
    prefetchUserData,
  };
}

// Hook for authentication status checking across the app
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user, authError } = useGlobalData();

  return {
    isAuthenticated,
    isLoading,
    user,
    authError,
  };
}
