import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@/routes/router";
import { createContext } from "@/lib/context";
import { startCronJobs } from "@/cron/scheduler";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = new Hono();

// CORS middleware
app.use(
  "/*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Health check endpoint
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// tRPC endpoint
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

const port = Number(process.env.PORT) || 3001;

console.log(`🚀 Server is running on port ${port}`);

// Start cron jobs
startCronJobs();

serve({
  fetch: app.fetch,
  port,
});
