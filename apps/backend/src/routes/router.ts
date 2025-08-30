import { createTRPCRouter } from "@/lib/trpc";
import { authRouter } from "./auth";
import { nostrRouter } from "./nostr";
import { emailsRouter } from "./emails";
import { paymentsRouter } from "./payments";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  nostr: nostrRouter,
  emails: emailsRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
