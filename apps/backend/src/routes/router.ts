import { createTRPCRouter } from "@/lib/trpc";
import {
  authRouter,
  nostrRouter,
  emailsRouter,
  paymentsRouter,
} from "@deadmansswitch/endpoints";

export const appRouter = createTRPCRouter({
  auth: authRouter as any,
  nostr: nostrRouter as any,
  emails: emailsRouter as any,
  payments: paymentsRouter as any,
});

export type AppRouter = typeof appRouter;
