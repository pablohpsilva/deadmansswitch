import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc";
import { db } from "@/db/connection";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Pricing configuration
const PRICING = {
  premium: {
    yearly: {
      priceId:
        process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || "price_premium_yearly",
      amount: 1500, // $15.00 in cents
      currency: "usd",
      interval: "year",
      lightning: 30000, // ~30,000 sats ($15 at $50k BTC)
    },
  },
  lifetime: {
    onetime: {
      priceId: process.env.STRIPE_LIFETIME_PRICE_ID || "price_lifetime",
      amount: 6000, // $60.00 in cents
      currency: "usd",
      lightning: 120000, // ~120,000 sats ($60 at $50k BTC)
    },
  },
};

export const paymentsRouter = createTRPCRouter({
  // Get pricing information
  getPricing: protectedProcedure.query(() => {
    return {
      free: {
        name: "Free",
        price: 0,
        features: [
          "Up to 2 emails",
          "2 recipients per email",
          "125 character subject line",
          "2000 character content",
          "Basic scheduling",
          "Nostr encryption",
        ],
      },
      premium: {
        name: "Premium",
        price: PRICING.premium.yearly.amount / 100,
        interval: "year",
        lightning: PRICING.premium.yearly.lightning,
        features: [
          "Up to 100 emails",
          "10 recipients per email",
          "300 character subject line",
          "10,000 character content",
          "Advanced scheduling",
          "Nostr encryption",
          "Priority support",
        ],
      },
      lifetime: {
        name: "Lifetime",
        price: PRICING.lifetime.onetime.amount / 100,
        interval: "one-time",
        lightning: PRICING.lifetime.onetime.lightning,
        features: [
          "Up to 100 emails",
          "10 recipients per email",
          "300 character subject line",
          "10,000 character content",
          "Advanced scheduling",
          "Nostr encryption",
          "Lifetime updates",
          "Priority support",
        ],
      },
    };
  }),

  // Get current subscription status
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db
      .select({
        tier: users.tier,
        stripeCustomerId: users.stripeCustomerId,
        subscriptionId: users.subscriptionId,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionEnds: users.subscriptionEnds,
      })
      .from(users)
      .where(eq(users.id, ctx.user.userId));

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    let stripeSubscription = null;
    if (user.subscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          user.subscriptionId
        );
      } catch (error) {
        console.error("Failed to retrieve Stripe subscription:", error);
      }
    }

    return {
      tier: user.tier,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEnds: user.subscriptionEnds,
      stripeSubscription,
    };
  }),

  // Create checkout session for premium subscription
  createPremiumCheckout: protectedProcedure
    .input(
      z.object({
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { successUrl, cancelUrl } = input;

      // Get or create Stripe customer
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.userId));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: {
            userId: user.id,
          },
        });

        customerId = customer.id;

        // Update user with customer ID
        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, user.id));
      }

      try {
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ["card"],
          line_items: [
            {
              price: PRICING.premium.yearly.priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            userId: user.id,
            tier: "premium",
          },
        });

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (error) {
        console.error("Failed to create checkout session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Create checkout session for lifetime purchase
  createLifetimeCheckout: protectedProcedure
    .input(
      z.object({
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { successUrl, cancelUrl } = input;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.userId));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: {
            userId: user.id,
          },
        });

        customerId = customer.id;

        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, user.id));
      }

      try {
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ["card"],
          line_items: [
            {
              price: PRICING.lifetime.onetime.priceId,
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            userId: user.id,
            tier: "lifetime",
          },
        });

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (error) {
        console.error("Failed to create lifetime checkout session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.userId));

    if (!user || !user.subscriptionId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription found",
      });
    }

    try {
      // Cancel the subscription at period end
      await stripe.subscriptions.update(user.subscriptionId, {
        cancel_at_period_end: true,
      });

      // Log the cancellation
      await db.insert(auditLogs).values({
        userId: user.id,
        action: "subscription_cancelled",
        details: JSON.stringify({
          subscriptionId: user.subscriptionId,
          cancelledAt: new Date(),
        }),
      });

      return {
        success: true,
        message:
          "Subscription will be cancelled at the end of the billing period",
      };
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  // Reactivate subscription
  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.userId));

    if (!user || !user.subscriptionId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No subscription found",
      });
    }

    try {
      // Reactivate the subscription
      await stripe.subscriptions.update(user.subscriptionId, {
        cancel_at_period_end: false,
      });

      // Log the reactivation
      await db.insert(auditLogs).values({
        userId: user.id,
        action: "subscription_reactivated",
        details: JSON.stringify({
          subscriptionId: user.subscriptionId,
          reactivatedAt: new Date(),
        }),
      });

      return {
        success: true,
        message: "Subscription reactivated successfully",
      };
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to reactivate subscription",
      });
    }
  }),

  // Handle webhook events (this would typically be a separate endpoint)
  handleWebhook: protectedProcedure
    .input(
      z.object({
        eventType: z.string(),
        data: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const { eventType, data } = input;

      switch (eventType) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(data);
          break;
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(data);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(data);
          break;
        case "invoice.payment_succeeded":
          await handlePaymentSucceeded(data);
          break;
        case "invoice.payment_failed":
          await handlePaymentFailed(data);
          break;
        default:
          console.log(`Unhandled webhook event: ${eventType}`);
      }

      return { success: true };
    }),

  // Lightning Network payment endpoints

  // Create Lightning invoice for premium subscription
  createLightningPremiumInvoice: protectedProcedure.mutation(
    async ({ ctx }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.userId));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.tier !== "free") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has a subscription",
        });
      }

      // Generate a unique payment hash for tracking
      const paymentHash = crypto.randomBytes(32).toString("hex");
      const description = `Dead Man's Switch Premium (1 year) - User ${user.id}`;

      // Log the pending payment
      await db.insert(auditLogs).values({
        userId: user.id,
        action: "lightning_invoice_created",
        details: JSON.stringify({
          tier: "premium",
          amount: PRICING.premium.yearly.lightning,
          paymentHash,
          description,
        }),
      });

      return {
        amount: PRICING.premium.yearly.lightning,
        description,
        paymentHash,
        memo: "Dead Man's Switch Premium Subscription",
      };
    }
  ),

  // Create Lightning invoice for lifetime purchase
  createLightningLifetimeInvoice: protectedProcedure.mutation(
    async ({ ctx }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.userId));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.tier === "lifetime") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has lifetime access",
        });
      }

      // Generate a unique payment hash for tracking
      const paymentHash = crypto.randomBytes(32).toString("hex");
      const description = `Dead Man's Switch Lifetime - User ${user.id}`;

      // Log the pending payment
      await db.insert(auditLogs).values({
        userId: user.id,
        action: "lightning_invoice_created",
        details: JSON.stringify({
          tier: "lifetime",
          amount: PRICING.lifetime.onetime.lightning,
          paymentHash,
          description,
        }),
      });

      return {
        amount: PRICING.lifetime.onetime.lightning,
        description,
        paymentHash,
        memo: "Dead Man's Switch Lifetime Access",
      };
    }
  ),

  // Verify Lightning payment and upgrade account
  verifyLightningPayment: protectedProcedure
    .input(
      z.object({
        paymentHash: z.string(),
        preimage: z.string(),
        tier: z.enum(["premium", "lifetime"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { paymentHash, preimage, tier } = input;

      // Verify the preimage matches the payment hash
      const expectedHash = crypto
        .createHash("sha256")
        .update(Buffer.from(preimage, "hex"))
        .digest("hex");
      if (expectedHash !== paymentHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid payment proof",
        });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.userId));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if payment was already processed
      const existingPayment = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, user.id));

      const alreadyProcessed = existingPayment.some(
        (log) =>
          log.details?.includes(paymentHash) &&
          log.action === "lightning_payment_verified"
      );

      if (alreadyProcessed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment already processed",
        });
      }

      // Upgrade the user account
      const updates: Partial<typeof users.$inferInsert> = {
        tier,
        updatedAt: new Date(),
      };

      if (tier === "premium") {
        // Premium is a yearly subscription
        updates.subscriptionEnds = new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ); // 1 year
        updates.subscriptionStatus = "active";
      }

      await db.update(users).set(updates).where(eq(users.id, user.id));

      // Log the successful payment
      await db.insert(auditLogs).values({
        userId: user.id,
        action: "lightning_payment_verified",
        details: JSON.stringify({
          tier,
          paymentHash,
          preimage,
          upgradedAt: new Date(),
          amount:
            tier === "premium"
              ? PRICING.premium.yearly.lightning
              : PRICING.lifetime.onetime.lightning,
        }),
      });

      return {
        success: true,
        message: `Account upgraded to ${tier}`,
        tier,
        subscriptionEnds: updates.subscriptionEnds,
      };
    }),

  // Get Lightning payment status
  getLightningPaymentStatus: protectedProcedure
    .input(z.object({ paymentHash: z.string() }))
    .query(async ({ ctx, input }) => {
      const { paymentHash } = input;

      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, ctx.user.userId));

      const invoiceLog = logs.find(
        (log) =>
          log.details?.includes(paymentHash) &&
          log.action === "lightning_invoice_created"
      );

      const paymentLog = logs.find(
        (log) =>
          log.details?.includes(paymentHash) &&
          log.action === "lightning_payment_verified"
      );

      if (!invoiceLog) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      return {
        paymentHash,
        status: paymentLog ? "paid" : "pending",
        createdAt: invoiceLog.createdAt,
        paidAt: paymentLog?.createdAt || null,
      };
    }),
});

// Webhook handlers
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as "premium" | "lifetime";

  if (!userId || !tier) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const updates: Partial<typeof users.$inferInsert> = {
    tier,
    updatedAt: new Date(),
  };

  if (tier === "premium") {
    updates.subscriptionId = session.subscription as string;
    updates.subscriptionStatus = "active";
  }

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
  if (!userId) return;

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
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

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

  await db.insert(auditLogs).values({
    userId,
    action: "subscription_deleted",
    details: JSON.stringify({
      subscriptionId: subscription.id,
      deletedAt: new Date(),
    }),
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const userId = invoice.customer_details?.metadata?.userId;
  if (!userId) return;

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
  const userId = invoice.customer_details?.metadata?.userId;
  if (!userId) return;

  await db.insert(auditLogs).values({
    userId,
    action: "payment_failed",
    details: JSON.stringify({
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      reason: invoice.status,
    }),
  });
}
