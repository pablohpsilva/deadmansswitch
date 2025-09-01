/**
 * Global application data hooks using React Query
 * Provides app-wide data like user session, configuration, stats, etc.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { useAuthRefresh } from "./useAuthRefresh";

export function useGlobalData() {
  const queryClient = useQueryClient();
  const authRefresh = useAuthRefresh();

  // User session data (cached globally)
  const userSession = (trpc as any).auth.me.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true, // Important for auth state
    retry: (failureCount: number, error: any) => {
      // For auth errors, handle them differently
      if (error && "status" in error) {
        const status = (error as any).status;
        if (status === 401 || status === 403) {
          // Trigger async auth refresh (don't wait for it)
          if (failureCount === 0) {
            authRefresh.handleAuthError(error).catch((refreshError) => {
              console.error(
                "Auth refresh failed in useGlobalData:",
                refreshError
              );
            });
          }
          return false; // Don't retry immediately, let the auth refresh handle it
        }
      }
      return failureCount < 2; // Normal retry logic for non-auth errors
    },
  });

  // Tier limits (rarely change, cache longer)
  const tierLimits = (trpc as any).emails.getTierLimits.useQuery(undefined, {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!userSession.data, // Only fetch if user is authenticated
    retry: (failureCount: number, error: any) => {
      // Handle auth errors with refresh (async, fire-and-forget)
      if (
        error &&
        ("status" in error || error?.data?.code === "UNAUTHORIZED")
      ) {
        const status = (error as any).status;
        if (
          status === 401 ||
          status === 403 ||
          error?.data?.code === "UNAUTHORIZED"
        ) {
          if (failureCount === 0) {
            authRefresh.handleAuthError(error).catch((refreshError) => {
              console.error("Auth refresh failed in tierLimits:", refreshError);
            });
          }
          return false;
        }
      }
      return failureCount < 2;
    },
  });

  // App configuration or stats from API
  const appStats = useQuery({
    queryKey: ["app-stats"],
    queryFn: async () => {
      // Fetch from our new API endpoint
      const response = await fetch("/api/public/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch app stats");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 1000, // Update every minute for live stats
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

  // Enhanced logout function using auth refresh hook
  const logout = authRefresh.forceLogout;

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

    // Auth refresh utilities
    handleAuthError: authRefresh.handleAuthError,
    refreshToken: authRefresh.refreshToken,
    refreshIfNeeded: authRefresh.refreshIfNeeded,
    checkTokenExpiry: authRefresh.checkTokenExpiry,
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
