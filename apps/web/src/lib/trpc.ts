import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../backend/src/routes/router";

export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // Browser should use relative URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3001}`;
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      headers() {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token")
            : null;
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
