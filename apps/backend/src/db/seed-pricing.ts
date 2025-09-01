import { db } from "./connection";
import { pricingTiers, paymentMethods, pricingConfigurations } from "./schema";
import { eq } from "drizzle-orm";

// Seed pricing data
export async function seedPricingData() {
  console.log("🌱 Seeding pricing data...");

  try {
    // Clear existing pricing data
    await db.delete(pricingConfigurations);
    await db.delete(paymentMethods);
    await db.delete(pricingTiers);

    // Insert pricing tiers
    const tierData = [
      {
        name: "free",
        displayName: "Free",
        description: "Perfect for getting started",
        features: [
          "Up to 2 emails",
          "2 recipients per email",
          "125 character subject line",
          "2000 character content",
          "Basic scheduling",
          "Nostr encryption",
          "Single relay storage (basic)",
        ],
        maxEmails: 2,
        maxRecipients: 2,
        maxSubjectLength: 125,
        maxContentLength: 2000,
        maxRelays: 1,
        sortOrder: 1,
      },
      {
        name: "premium",
        displayName: "Premium",
        description: "For serious users",
        features: [
          "Up to 100 emails",
          "10 recipients per email",
          "300 character subject line",
          "10,000 character content",
          "Advanced scheduling",
          "Nostr encryption",
          "Multi-relay storage (up to 10 relays)",
          "Enhanced decentralization",
          "Priority support",
        ],
        maxEmails: 100,
        maxRecipients: 10,
        maxSubjectLength: 300,
        maxContentLength: 10000,
        maxRelays: 10,
        sortOrder: 2,
      },
      {
        name: "lifetime",
        displayName: "Lifetime",
        description: "Pay once, use forever",
        features: [
          "Up to 50 emails",
          "10 recipients per email",
          "300 character subject line",
          "10,000 character content",
          "Advanced scheduling",
          "Nostr encryption",
          "Multi-relay storage (up to 3 relays)",
          "Optimized decentralization",
          "Lifetime updates",
          "Priority support",
        ],
        maxEmails: 50,
        maxRecipients: 10,
        maxSubjectLength: 300,
        maxContentLength: 10000,
        maxRelays: 3,
        sortOrder: 3,
      },
    ];

    const insertedTiers = await db
      .insert(pricingTiers)
      .values(tierData)
      .returning();
    console.log(`✅ Inserted ${insertedTiers.length} pricing tiers`);

    // Insert payment methods
    const paymentMethodData = [
      {
        name: "stripe",
        displayName: "Credit/Debit Card",
        description: "Pay with any major credit or debit card",
        icon: "CreditCard",
        requiresKyc: true,
        includesTax: false, // Tax calculated at checkout
        sortOrder: 1,
        configuration: {
          processor: "stripe",
          supportedCards: ["visa", "mastercard", "amex", "discover"],
          currencies: ["USD"],
        },
      },
      {
        name: "lightning",
        displayName: "Bitcoin Lightning",
        description: "Fast, private Bitcoin payments with instant settlement",
        icon: "Zap",
        requiresKyc: false,
        includesTax: true, // No tax
        sortOrder: 2,
        configuration: {
          network: "bitcoin",
          type: "lightning",
          unit: "sats",
          benefits: [
            "10% discount",
            "No taxes",
            "Complete privacy",
            "Instant settlement",
          ],
        },
      },
      {
        name: "stablecoin",
        displayName: "Stablecoins",
        description: "Pay with USDT or USDC on Ethereum or TRON networks",
        icon: "Coins",
        requiresKyc: false,
        includesTax: true, // No tax
        sortOrder: 3,
        configuration: {
          supportedTokens: ["USDT", "USDC"],
          supportedNetworks: ["Ethereum", "TRON"],
          benefits: [
            "7% discount",
            "No taxes",
            "Blockchain transparency",
            "No personal info required",
          ],
        },
      },
    ];

    const insertedPaymentMethods = await db
      .insert(paymentMethods)
      .values(paymentMethodData)
      .returning();
    console.log(`✅ Inserted ${insertedPaymentMethods.length} payment methods`);

    // Create maps for easier reference
    const tierMap = insertedTiers.reduce((acc, tier) => {
      acc[tier.name] = tier;
      return acc;
    }, {} as Record<string, (typeof insertedTiers)[0]>);

    const paymentMap = insertedPaymentMethods.reduce((acc, method) => {
      acc[method.name] = method;
      return acc;
    }, {} as Record<string, (typeof insertedPaymentMethods)[0]>);

    // Insert pricing configurations
    const pricingConfigData = [
      // Free tier - no payment needed
      {
        tierId: tierMap.free.id,
        paymentMethodId: paymentMap.stripe.id, // Reference but not used
        basePrice: "0.00",
        discountPercent: 0,
        finalPrice: "0.00",
        currency: "USD",
        interval: "forever",
        isActive: true,
      },

      // Premium tier - Stripe
      {
        tierId: tierMap.premium.id,
        paymentMethodId: paymentMap.stripe.id,
        basePrice: "15.00",
        discountPercent: 0,
        finalPrice: "15.00",
        currency: "USD",
        interval: "year",
        stripeProductId:
          process.env.STRIPE_PREMIUM_PRODUCT_ID || "prod_premium",
        stripePriceId:
          process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || "price_premium_yearly",
        isActive: true,
      },

      // Premium tier - Lightning
      {
        tierId: tierMap.premium.id,
        paymentMethodId: paymentMap.lightning.id,
        basePrice: "15.00",
        discountPercent: 10,
        finalPrice: "13.50",
        currency: "USD",
        interval: "year",
        cryptoAmount: "27000",
        cryptoUnit: "sats",
        isActive: true,
      },

      // Premium tier - Stablecoin
      {
        tierId: tierMap.premium.id,
        paymentMethodId: paymentMap.stablecoin.id,
        basePrice: "15.00",
        discountPercent: 7,
        finalPrice: "13.95",
        currency: "USD",
        interval: "year",
        isActive: true,
      },

      // Lifetime tier - Stripe
      {
        tierId: tierMap.lifetime.id,
        paymentMethodId: paymentMap.stripe.id,
        basePrice: "60.00",
        discountPercent: 0,
        finalPrice: "60.00",
        currency: "USD",
        interval: "lifetime",
        stripeProductId:
          process.env.STRIPE_LIFETIME_PRODUCT_ID || "prod_lifetime",
        stripePriceId: process.env.STRIPE_LIFETIME_PRICE_ID || "price_lifetime",
        isActive: true,
      },

      // Lifetime tier - Lightning
      {
        tierId: tierMap.lifetime.id,
        paymentMethodId: paymentMap.lightning.id,
        basePrice: "60.00",
        discountPercent: 10,
        finalPrice: "54.00",
        currency: "USD",
        interval: "lifetime",
        cryptoAmount: "108000",
        cryptoUnit: "sats",
        isActive: true,
      },

      // Lifetime tier - Stablecoin
      {
        tierId: tierMap.lifetime.id,
        paymentMethodId: paymentMap.stablecoin.id,
        basePrice: "60.00",
        discountPercent: 7,
        finalPrice: "55.80",
        currency: "USD",
        interval: "lifetime",
        isActive: true,
      },
    ];

    const insertedConfigs = await db
      .insert(pricingConfigurations)
      .values(pricingConfigData)
      .returning();
    console.log(`✅ Inserted ${insertedConfigs.length} pricing configurations`);

    console.log("🎉 Pricing data seeding completed successfully!");

    return {
      tiers: insertedTiers,
      paymentMethods: insertedPaymentMethods,
      configurations: insertedConfigs,
    };
  } catch (error) {
    console.error("❌ Error seeding pricing data:", error);
    throw error;
  }
}

// Run if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  seedPricingData()
    .then(() => {
      console.log("Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
