import type { Context } from "hono";
import { db } from "../db/connection";
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

export async function createContext(opts: {
  c?: Context;
  req?: any;
}): Promise<TRPCContext> {
  const context = opts.c || opts;

  let authHeader;
  if (context && context.req && context.req.header) {
    // Hono context
    authHeader = context.req.header("authorization");
  } else if (opts.req && opts.req.headers) {
    // Standard request object
    authHeader = opts.req.headers.authorization;
  }

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;

  let user;
  if (token) {
    try {
      user = await verifyToken(token);
    } catch (error) {
      // Invalid token, user remains undefined
      console.warn("Invalid token:", error);
    }
  }

  return {
    user,
    db,
  };
}
