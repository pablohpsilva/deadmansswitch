import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@/routes/router";
import { createContext } from "@/lib/context";
import Stripe from "stripe";
import { db, users, auditLogs, eq } from "@deadmansswitch/database";
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

// Stripe webhook endpoint (must be before tRPC to handle raw body)
app.post("/webhooks/stripe", async (c) => {
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature");

  if (!sig) {
    console.error("❌ No Stripe signature header found");
    return c.json({ error: "No signature header" }, 400);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  console.log(`🎯 Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`⚠️ Unhandled webhook event: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

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
console.log(
  `🔧 [STARTUP DEBUG] Context creation function loaded at:`,
  createContext.toString().substring(0, 100)
);

// Cron jobs are now handled by the separate cron app
console.log("📝 Note: Cron jobs are now handled by the separate cron app");

// Webhook handlers
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as "premium" | "lifetime";

  if (!userId || !tier) {
    console.error("❌ Missing metadata in checkout session", {
      userId,
      tier,
      sessionId: session.id,
    });
    return;
  }

  console.log(
    `🔄 Processing checkout completion for user ${userId}, tier: ${tier}`
  );

  const updates: any = {
    tier,
    updatedAt: new Date(),
  };

  if (tier === "premium") {
    updates.subscriptionId = session.subscription as string;
    updates.subscriptionStatus = "active";
  }

  // Update user tier
  await db.update(users).set(updates).where(eq(users.id, userId));

  // Log the successful purchase
  await db.insert(auditLogs).values({
    userId,
    action: "purchase_completed",
    details: JSON.stringify({
      tier,
      sessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
    }),
  });

  console.log(`✅ User ${userId} upgraded to ${tier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("❌ No userId in subscription metadata");
    return;
  }

  console.log(
    `🔄 Updating subscription for user ${userId}: ${subscription.status}`
  );

  await db
    .update(users)
    .set({
      subscriptionStatus: subscription.status,
      subscriptionEnds: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.log(`✅ Subscription updated for user ${userId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("❌ No userId in subscription metadata");
    return;
  }

  console.log(`🔄 Deleting subscription for user ${userId}`);

  await db
    .update(users)
    .set({
      tier: "free",
      subscriptionId: null,
      subscriptionStatus: null,
      subscriptionEnds: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Log the subscription deletion
  await db.insert(auditLogs).values({
    userId,
    action: "subscription_deleted",
    details: JSON.stringify({
      subscriptionId: subscription.id,
      deletedAt: new Date(),
    }),
  });

  console.log(`✅ Subscription deleted for user ${userId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = invoice.subscription;
  if (!subscription || typeof subscription === "string") return;

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("❌ No userId in subscription metadata");
    return;
  }

  console.log(
    `✅ Payment succeeded for user ${userId}: $${(
      invoice.amount_paid / 100
    ).toFixed(2)}`
  );

  await db.insert(auditLogs).values({
    userId,
    action: "payment_succeeded",
    details: JSON.stringify({
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
    }),
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = invoice.subscription;
  if (!subscription || typeof subscription === "string") return;

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("❌ No userId in subscription metadata");
    return;
  }

  console.log(
    `❌ Payment failed for user ${userId}: $${(
      invoice.amount_due / 100
    ).toFixed(2)}`
  );

  await db.insert(auditLogs).values({
    userId,
    action: "payment_failed",
    details: JSON.stringify({
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      failureReason: invoice.last_finalization_error?.message,
    }),
  });
}

serve({
  fetch: app.fetch,
  port,
});
