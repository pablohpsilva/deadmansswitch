import { db, users, nostrRelays, seedPricing } from "./index";

interface SeedOptions {
  generateNostrKeypair: () => Promise<{
    privateKey: string;
    publicKey: string;
  }>;
  encryptData: (data: string) => string;
}

export async function seedDatabase(options: SeedOptions) {
  console.log("🌱 Seeding database...");

  const { generateNostrKeypair, encryptData } = options;

  try {
    // Seed pricing data first
    await seedPricing();

    // Create a test user
    const keypair = await generateNostrKeypair();

    const testUser = await db
      .insert(users)
      .values({
        email: "test@example.com",
        nostrPrivateKey: encryptData(keypair.privateKey),
        nostrPublicKey: keypair.publicKey,
        tier: "free",
      })
      .returning();

    console.log("✅ Created test user:", testUser[0].id);

    // Add default Nostr relays for the test user
    const defaultRelays = [
      { url: "wss://relay.damus.io", name: "Damus" },
      { url: "wss://nos.lol", name: "nos.lol" },
      { url: "wss://relay.nostr.band", name: "nostr.band" },
    ];

    for (const relay of defaultRelays) {
      await db.insert(nostrRelays).values({
        userId: testUser[0].id,
        url: relay.url,
        name: relay.name,
        isActive: true,
      });
    }

    console.log("✅ Added default Nostr relays");
    console.log("🎉 Database seeded successfully");

    return {
      testUser: testUser[0],
      relaysAdded: defaultRelays.length,
    };
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Simple seeding function without crypto dependencies (for basic testing)
export async function seedDatabaseBasic() {
  console.log("🌱 Seeding database (basic)...");

  try {
    // Seed pricing data
    await seedPricing();
    console.log("✅ Pricing data seeded");

    return { message: "Basic seeding completed" };
  } catch (error) {
    console.error("❌ Basic seeding failed:", error);
    throw error;
  }
}
