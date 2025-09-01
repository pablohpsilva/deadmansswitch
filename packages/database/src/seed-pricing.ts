import {
  db,
  pricingTiers,
  paymentMethods,
  pricingConfigurations,
  eq,
} from "./index";

export async function seedPricing() {
  try {
    console.log("🌱 Seeding pricing data...");

    // Clear existing data (in reverse order of dependencies)
    console.log("🧹 Clearing existing pricing data...");
    await db.delete(pricingConfigurations);
    await db.delete(paymentMethods);
    await db.delete(pricingTiers);

    // Insert pricing tiers with features
    console.log("📊 Inserting pricing tiers...");
    const [freeTier, premiumTier, lifetimeTier] = await db
      .insert(pricingTiers)
      .values([
        {
          name: "free",
          displayName: "Free",
          description: "Perfect for getting started",
          features: [
            "Up to 2 emails",
            "Up to 2 recipients per email",
            "125 character subject limit",
            "2K character content limit",
            "Basic scheduling",
            "End-to-end encryption",
            "1 relay storage",
          ],
          maxEmails: 2,
          maxRecipients: 2,
          maxSubjectLength: 125,
          maxContentLength: 2000,
          maxRelays: 1,
          isActive: true,
          sortOrder: 1,
        },
        {
          name: "premium",
          displayName: "Premium",
          description: "For serious users",
          features: [
            "Up to 100 emails",
            "Up to 10 recipients per email",
            "300 character subject limit",
            "10K character content limit",
            "Advanced scheduling",
            "End-to-end encryption",
            "Up to 10 relay storage",
            "Multi-relay storage",
            "Enhanced decentralization",
            "Priority support",
            "Regular updates",
          ],
          maxEmails: 100,
          maxRecipients: 10,
          maxSubjectLength: 300,
          maxContentLength: 10000,
          maxRelays: 10,
          isActive: true,
          sortOrder: 2,
        },
        {
          name: "lifetime",
          displayName: "Lifetime",
          description: "Pay once, use forever",
          features: [
            "Up to 50 emails",
            "Up to 10 recipients per email",
            "300 character subject limit",
            "10K character content limit",
            "Advanced scheduling",
            "End-to-end encryption",
            "Up to 3 relay storage",
            "Optimized decentralization",
            "Lifetime updates",
          ],
          maxEmails: 50,
          maxRecipients: 10,
          maxSubjectLength: 300,
          maxContentLength: 10000,
          maxRelays: 3,
          isActive: true,
          sortOrder: 3,
        },
      ])
      .returning();

    // Insert payment methods
    console.log("💳 Inserting payment methods...");
    const [stripeMethod, lightningMethod, stablecoinMethod] = await db
      .insert(paymentMethods)
      .values([
        {
          name: "stripe",
          displayName: "Credit/Debit Card",
          description: "Pay with your credit or debit card",
          icon: "credit-card",
          isActive: true,
          sortOrder: 1,
          requiresKyc: true,
          includesTax: true,
          configuration: {
            supportedCards: ["visa", "mastercard", "amex"],
          },
        },
        {
          name: "lightning",
          displayName: "Bitcoin Lightning",
          description: "Instant Bitcoin payments",
          icon: "bitcoin",
          isActive: true,
          sortOrder: 2,
          requiresKyc: false,
          includesTax: false,
          configuration: {
            discountPercent: 10,
            acceptsLNURL: true,
          },
        },
        {
          name: "stablecoin",
          displayName: "Stablecoins",
          description: "USDT/USDC on Ethereum or TRON",
          icon: "coins",
          isActive: true,
          sortOrder: 3,
          requiresKyc: false,
          includesTax: false,
          configuration: {
            discountPercent: 7,
            acceptedTokens: ["USDT", "USDC"],
            networks: ["ethereum", "tron"],
          },
        },
      ])
      .returning();

    // Insert pricing configurations
    console.log("⚙️ Inserting pricing configurations...");
    await db.insert(pricingConfigurations).values([
      // Premium configurations
      {
        tierId: premiumTier.id,
        paymentMethodId: stripeMethod.id,
        basePrice: "99.00",
        discountPercent: 0,
        finalPrice: "99.00",
        currency: "USD",
        interval: "year",
        stripePriceId: "price_premium_yearly",
        isActive: true,
      },
      {
        tierId: premiumTier.id,
        paymentMethodId: lightningMethod.id,
        basePrice: "99.00",
        discountPercent: 10,
        finalPrice: "89.10",
        currency: "USD",
        interval: "year",
        cryptoAmount: "89100",
        cryptoUnit: "sats",
        isActive: true,
      },
      {
        tierId: premiumTier.id,
        paymentMethodId: stablecoinMethod.id,
        basePrice: "99.00",
        discountPercent: 7,
        finalPrice: "92.07",
        currency: "USD",
        interval: "year",
        isActive: true,
      },
      // Lifetime configurations
      {
        tierId: lifetimeTier.id,
        paymentMethodId: stripeMethod.id,
        basePrice: "499.00",
        discountPercent: 0,
        finalPrice: "499.00",
        currency: "USD",
        interval: "lifetime",
        stripePriceId: "price_lifetime_onetime",
        isActive: true,
      },
      {
        tierId: lifetimeTier.id,
        paymentMethodId: lightningMethod.id,
        basePrice: "499.00",
        discountPercent: 10,
        finalPrice: "449.10",
        currency: "USD",
        interval: "lifetime",
        cryptoAmount: "449100",
        cryptoUnit: "sats",
        isActive: true,
      },
      {
        tierId: lifetimeTier.id,
        paymentMethodId: stablecoinMethod.id,
        basePrice: "499.00",
        discountPercent: 7,
        finalPrice: "464.07",
        currency: "USD",
        interval: "lifetime",
        isActive: true,
      },
    ]);

    console.log("✅ Pricing data seeded successfully!");

    // Verify the data
    console.log("\n📋 Verifying seeded data:");
    const tiers = await db.select().from(pricingTiers);
    const methods = await db.select().from(paymentMethods);
    const configs = await db.select().from(pricingConfigurations);

    console.log(`📊 Pricing Tiers: ${tiers.length}`);
    tiers.forEach((tier) => {
      console.log(
        `  - ${tier.displayName}: ${tier.maxEmails} emails, ${tier.maxRelays} relays`
      );
    });

    console.log(`💳 Payment Methods: ${methods.length}`);
    methods.forEach((method) => {
      const discount = (method.configuration as any)?.discountPercent || 0;
      console.log(`  - ${method.displayName}: ${discount}% discount`);
    });

    console.log(`⚙️ Pricing Configurations: ${configs.length}`);
    configs.forEach((config) => {
      console.log(
        `  - ${config.basePrice} → ${config.finalPrice} (${config.discountPercent}% off)`
      );
    });

    return {
      tiersCount: tiers.length,
      methodsCount: methods.length,
      configsCount: configs.length,
    };
  } catch (error) {
    console.error("❌ Error seeding pricing data:", error);
    throw error;
  }
}

// Run directly if this file is executed
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPricing()
    .then((result) => {
      console.log("\n🎉 Pricing seeding completed!", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Pricing seeding failed:", error);
      process.exit(1);
    });
}
