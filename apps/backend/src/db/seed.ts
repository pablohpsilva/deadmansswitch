import { db } from "./connection";
import { users, nostrRelays } from "./schema";
import { generateNostrKeypair, encryptData } from "@/lib/auth";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  console.log("🌱 Seeding database...");

  try {
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
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
