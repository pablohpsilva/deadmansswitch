/**
 * Authentication refresh hook for handling token expiration and auto-refresh
 * Provides automatic token refresh and logout functionality for authentication errors
 */

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";

export function useAuthRefresh() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const refreshInProgress = useRef(false);

  // Clear all auth data and redirect to login
  const forceLogout = useCallback(() => {
    console.log("🔄 [AUTH] Force logout - cleaning up and redirecting");

    // Clear localStorage
    localStorage.removeItem("auth_token");

    // Clear all React Query cache
    queryClient.clear();

    // Redirect to login page
    router.push("/auth/login");
  }, [router, queryClient]);

  // Attempt to refresh the token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous refresh attempts
    if (refreshInProgress.current) {
      console.log("🔄 [AUTH] Refresh already in progress, waiting...");
      return false;
    }

    const currentToken = localStorage.getItem("auth_token");
    if (!currentToken) {
      console.log("🔄 [AUTH] No token found, cannot refresh");
      return false;
    }

    try {
      console.log("🔄 [AUTH] Attempting to refresh token...");
      refreshInProgress.current = true;

      // Call the refresh endpoint
      const result = await (trpcClient as any).auth.refreshToken.mutate();

      if (result?.token) {
        console.log("✅ [AUTH] Token refresh successful");

        // Update localStorage with new token
        localStorage.setItem("auth_token", result.token);

        // Invalidate all queries to refetch with new token
        await queryClient.invalidateQueries();

        return true;
      } else {
        console.log("❌ [AUTH] Refresh response missing token");
        return false;
      }
    } catch (error: any) {
      console.log("❌ [AUTH] Token refresh failed:", error?.message || error);

      // If refresh fails with auth errors, the token is definitely invalid
      if (error?.data?.code === "UNAUTHORIZED" || error?.status === 401) {
        console.log(
          "🔄 [AUTH] Refresh failed with auth error - token is invalid"
        );
        return false;
      }

      // For other errors (network, server), we might want to retry later
      console.log("🔄 [AUTH] Refresh failed with non-auth error - may retry");
      return false;
    } finally {
      refreshInProgress.current = false;
    }
  }, [queryClient]);

  // Main function to handle authentication errors
  const handleAuthError = useCallback(
    async (error: any): Promise<boolean> => {
      console.log(
        "🔄 [AUTH] Handling authentication error:",
        error?.message || error
      );

      // Check if this is an authentication error
      const isAuthError =
        error?.data?.code === "UNAUTHORIZED" ||
        error?.status === 401 ||
        error?.status === 403 ||
        error?.message?.includes("Authentication required") ||
        error?.message?.includes("Invalid token");

      if (!isAuthError) {
        console.log("🔄 [AUTH] Not an authentication error, skipping refresh");
        return false;
      }

      console.log(
        "🔄 [AUTH] Authentication error detected, attempting refresh..."
      );

      // Step 1: Try to refresh the token
      const refreshSuccessful = await refreshToken();

      if (refreshSuccessful) {
        console.log("✅ [AUTH] Token refresh successful, continuing...");
        return true;
      }

      // Step 2: If refresh fails, force logout
      console.log("❌ [AUTH] Token refresh failed, forcing logout");
      forceLogout();
      return false;
    },
    [refreshToken, forceLogout]
  );

  // Check if a token exists and is potentially expired
  const checkTokenExpiry = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return false;

    try {
      // Decode JWT to check expiry
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      // If token expires in less than 10 minutes, consider it expired
      return timeUntilExpiry < 10 * 60 * 1000;
    } catch (error) {
      console.log("🔄 [AUTH] Error checking token expiry:", error);
      return true; // Consider invalid tokens as expired
    }
  }, []);

  // Preemptive refresh if token is close to expiry
  const refreshIfNeeded = useCallback(async (): Promise<boolean> => {
    if (checkTokenExpiry()) {
      console.log(
        "🔄 [AUTH] Token is close to expiry, preemptively refreshing..."
      );
      return await refreshToken();
    }
    return true; // Token is still valid
  }, [checkTokenExpiry, refreshToken]);

  return {
    handleAuthError,
    refreshToken,
    forceLogout,
    refreshIfNeeded,
    checkTokenExpiry,
    isRefreshInProgress: () => refreshInProgress.current,
  };
}
