import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
// Note: This might need adjustment based on your actual backend structure
import type { AppRouter } from "../../../backend/src/routes/router";

export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // Browser should use relative URL (will hit Next.js API routes)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // For SSR, use the Next.js server (port 3000) which will proxy to backend
  return `http://localhost:3000`;
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      // Disable batching for now to fix request parsing issues
      maxBatchSize: 1,
      // Enhanced batch configuration for better performance
      maxURLLength: 2083, // Standard URL length limit
      headers() {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token")
            : null;
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
