import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
// Import shared types from packages
import type { AppRouter } from "../../../../packages/shared-types";

export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // Browser should use relative URL (will hit Next.js API routes)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // For SSR, use the Next.js server (port 3000) which will proxy to backend
  return `http://localhost:3000`;
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
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
