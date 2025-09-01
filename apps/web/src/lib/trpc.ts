import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
// Import shared types from packages
import type { AppRouter } from "../../../../packages/shared-types";

export const trpc = createTRPCReact() as any;

export function getBaseUrl() {
  // Always call the backend directly
  if (typeof window !== "undefined") {
    // Browser: use env var or default to localhost:3001
    return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  }
  if (process.env.VERCEL_URL) {
    // Production: use backend URL from env
    return process.env.BACKEND_URL || `https://${process.env.VERCEL_URL}`;
  }
  // SSR during development: call backend directly
  return process.env.BACKEND_URL || "http://localhost:3001";
}

export const trpcClient = createTRPCClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/trpc`,
      headers() {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token")
            : null;

        // Debug logging for client-side headers
        if (typeof window !== "undefined") {
          console.log("🔍 [CLIENT DEBUG] Getting headers for tRPC request");
          console.log(
            "🔍 [CLIENT DEBUG] Token from localStorage:",
            token ? `${token.substring(0, 20)}...` : "null"
          );
          console.log(
            "🔍 [CLIENT DEBUG] Token length:",
            token ? token.length : 0
          );
          console.log(
            "🔍 [CLIENT DEBUG] Token is JWT format:",
            token ? token.split(".").length === 3 : false
          );
          console.log(
            "🔍 [CLIENT DEBUG] Will send authorization header:",
            !!token
          );
          console.log(
            "🔍 [CLIENT DEBUG] Full authorization header:",
            token ? `Bearer ${token.substring(0, 30)}...` : "null"
          );
        }

        return token ? { authorization: `Bearer ${token}` } : {};
      },
      // Add better error handling
      fetch(url, options) {
        return fetch(url, {
          ...options,
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
      },
    }),
  ],
});
