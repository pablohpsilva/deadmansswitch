import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@deadmansswitch/database";

export interface TRPCContext {
  user?: {
    userId: string;
    email?: string;
    nostrPublicKey?: string;
    tier: "free" | "premium" | "lifetime";
  };
  db: typeof db;
}

const t = initTRPC.context<TRPCContext>().create();

// Base router and procedure
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Admin procedure (for future use)
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.tier !== "lifetime") {
    // For now, only lifetime users can access admin features
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
