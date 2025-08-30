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
  const requestEmailAuth = trpc.auth.requestEmailAuth.useMutation({
    onSuccess: (data) => {
      // Could show success message or update UI
      console.log("Email auth requested successfully:", data);
    },
    onError: (error) => {
      console.error("Failed to request email auth:", error);
      // Error will be handled by the calling component via mutation.error
    },
  });

  // Email login mutation
  const loginWithEmail = trpc.auth.loginWithEmail.useMutation({
    onSuccess: (data) => {
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
    onError: (error) => {
      console.error("Email login failed:", error);
      // Error handling will be done by the calling component
    },
  });

  // Nostr login mutation
  const loginWithNostr = trpc.auth.loginWithNostr.useMutation({
    onSuccess: (data) => {
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
    onError: (error) => {
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
    loginWithEmail,
    loginWithNostr,
    logout,
    checkAuthStatus,
    // Utility properties
    isAuthenticating:
      requestEmailAuth.isPending ||
      loginWithEmail.isPending ||
      loginWithNostr.isPending,
  };
}
