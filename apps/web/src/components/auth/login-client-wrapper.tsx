/**
 * Client-side wrapper for LoginClient to prevent SSR issues
 * This component ensures tRPC hooks only run on the client side
 */

"use client";

import dynamic from "next/dynamic";
import { LoginSkeleton } from "./login-skeleton";

// Dynamically import LoginClient with no SSR to avoid React Query context issues
const LoginClient = dynamic(
  () => import("./login-client").then((mod) => ({ default: mod.LoginClient })),
  {
    ssr: false,
    loading: () => <LoginSkeleton />,
  }
);

export function LoginClientWrapper() {
  return <LoginClient />;
}
