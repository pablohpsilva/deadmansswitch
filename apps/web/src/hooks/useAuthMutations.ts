/**
 * Authentication mutations using React Query with tRPC
 * Provides optimized auth flows with proper error handling and loading states
 */

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

export function useAuthMutations() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Email authentication request mutation
  const requestEmailAuth = (trpc as any).auth.requestEmailAuth.useMutation({
    onSuccess: (data: any) => {
      // Could show success message or update UI
      console.log("Email auth requested successfully:", data);
    },
    onError: (error: any) => {
      console.error("Failed to request email auth:", error);
      // Error will be handled by the calling component via mutation.error
    },
  });

  // Email OTP verification mutation
  const verifyEmailOTP = (trpc as any).auth.verifyEmailOTP.useMutation({
    onSuccess: (data: any) => {
      // Only redirect if we have a token (new users)
      // Existing users need to connect Nostr first
      if (data.token && !data.requiresNostrConnection) {
        localStorage.setItem("auth_token", data.token);

        // Prefetch dashboard data for faster navigation
        queryClient.prefetchQuery({
          queryKey: ["emails"],
          staleTime: 5 * 60 * 1000,
        });

        // Redirect to dashboard
        router.push("/dashboard");
      }
      // If requiresNostrConnection is true, the component will handle the next step
    },
    onError: (error: any) => {
      console.error("Email OTP verification failed:", error);
      // Error handling will be done by the calling component
    },
  });

  // Complete Nostr registration mutation
  const completeNostrRegistration = (
    trpc as any
  ).auth.completeNostrRegistration.useMutation({
    onSuccess: (data: any) => {
      // Store auth token and redirect
      if (data.token) {
        localStorage.setItem("auth_token", data.token);

        // Prefetch dashboard data for faster navigation
        queryClient.prefetchQuery({
          queryKey: ["emails"],
          staleTime: 5 * 60 * 1000,
        });

        // Redirect to dashboard
        router.push("/dashboard");
      }
    },
    onError: (error: any) => {
      console.error("Nostr registration failed:", error);
      // Error handling will be done by the calling component
    },
  });

  // Nostr login mutation
  const loginWithNostr = (trpc as any).auth.loginWithNostr.useMutation({
    onSuccess: (data: any) => {
      // Store auth token and redirect (only if user exists)
      if (data.token && data.userExists) {
        localStorage.setItem("auth_token", data.token);

        // Prefetch dashboard data for faster navigation
        queryClient.prefetchQuery({
          queryKey: ["emails"],
          staleTime: 5 * 60 * 1000,
        });

        // Redirect to dashboard
        router.push("/dashboard");
      }
      // If user doesn't exist, the component will handle the email flow
    },
    onError: (error: any) => {
      console.error("Nostr login failed:", error);
      // Error handling will be done by the calling component
    },
  });

  // Logout mutation (clears cache and redirects)
  const logout = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("auth_token");
      queryClient.clear(); // Clear all cached data
      router.push("/");
    },
  });

  // Check if user is already authenticated
  const checkAuthStatus = () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Redirect to dashboard if already authenticated
      router.push("/dashboard");
      return true;
    }
    return false;
  };

  return {
    requestEmailAuth,
    verifyEmailOTP,
    completeNostrRegistration,
    loginWithNostr,
    logout,
    checkAuthStatus,
    // Utility properties
    isAuthenticating:
      requestEmailAuth.isPending ||
      verifyEmailOTP.isPending ||
      completeNostrRegistration.isPending ||
      loginWithNostr.isPending,
  };
}
