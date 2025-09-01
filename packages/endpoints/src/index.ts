// Export all route modules for use in the backend
export { authRouter } from "./auth.js";
export { nostrRouter } from "./nostr.js";
export { emailsRouter } from "./emails.js";
export { paymentsRouter } from "./payments.js";

// Re-export commonly used types and utilities
export type { TRPCContext } from "./lib/trpc.js";
export {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "./lib/trpc.js";
