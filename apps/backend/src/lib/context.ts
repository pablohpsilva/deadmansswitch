import type { Context } from "hono";
import { db } from "@deadmansswitch/database";
import { verifyToken } from "./auth";

export interface TRPCContext {
  user?: {
    userId: string;
    email?: string;
    nostrPublicKey?: string;
    tier: "free" | "premium" | "lifetime";
  };
  db: typeof db;
}

export async function createContext(
  opts: any,
  c: Context
): Promise<Record<string, unknown>> {
  // Debug logging for auth flow
  console.log("🔍 [AUTH DEBUG] Context creation started");
  console.log("🔍 [AUTH DEBUG] Hono context received:", !!c);
  console.log("🔍 [AUTH DEBUG] Request URL:", c?.req?.url || "unknown");

  // Extract authorization header from Hono context
  let authHeader: string | undefined;
  if (c && c.req) {
    authHeader = c.req.header("authorization");
    console.log(
      "🔍 [AUTH DEBUG] Authorization header:",
      authHeader ? `${authHeader.substring(0, 30)}...` : "null"
    );
  } else {
    console.log("🔍 [AUTH DEBUG] ❌ No Hono context or request object found");
  }

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;

  console.log(
    "🔍 [AUTH DEBUG] Extracted token:",
    token ? `${token.substring(0, 20)}...` : "null"
  );
  console.log("🔍 [AUTH DEBUG] Token length:", token ? token.length : 0);
  console.log(
    "🔍 [AUTH DEBUG] Is JWT format:",
    token ? token.split(".").length === 3 : false
  );

  let user;
  if (token) {
    try {
      user = await verifyToken(token);
      console.log(
        "🔍 [AUTH DEBUG] ✅ Token verified successfully, user:",
        user.userId
      );
    } catch (error) {
      // Invalid token, user remains undefined
      console.warn(
        "🔍 [AUTH DEBUG] ❌ Invalid token:",
        error instanceof Error ? error.message : error
      );
    }
  } else {
    console.log("🔍 [AUTH DEBUG] ❌ No token provided");
  }

  console.log(
    "🔍 [AUTH DEBUG] Final user object:",
    user ? { userId: user.userId, tier: user.tier } : "null"
  );

  return {
    user,
    db,
  } as Record<string, unknown>;
}
