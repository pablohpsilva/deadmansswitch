#!/usr/bin/env tsx

/**
 * Data migration script to update existing users with proper authType values
 * Run this AFTER applying the database migration
 */

import { db, users } from "./index";
import { isNotNull, isNull } from "drizzle-orm";

export async function updateExistingUsers() {
  console.log("🔄 Starting user auth type migration...");

  try {
    // Set authType to 'email' for users who have email addresses
    // These are users who authenticated via email and have generated Nostr keys
    const emailUsersResult = await db
      .update(users)
      .set({ authType: "email" })
      .where(isNotNull(users.email))
      .returning({ id: users.id, email: users.email });

    console.log(
      `✅ Updated ${emailUsersResult.length} email-authenticated users:`
    );
    emailUsersResult.forEach((user) => {
      console.log(`   - ${user.email} (${user.id})`);
    });

    // Set authType to 'nostr' for users who have no email but have a public key
    // These are users who authenticated with their own Nostr keys
    const nostrUsersResult = await db
      .update(users)
      .set({
        authType: "nostr",
        // Ensure private key is null for nostr users (security measure)
        nostrPrivateKey: null,
      })
      .where(isNull(users.email))
      .returning({ id: users.id, nostrPublicKey: users.nostrPublicKey });

    console.log(
      `✅ Updated ${nostrUsersResult.length} nostr-authenticated users:`
    );
    nostrUsersResult.forEach((user) => {
      console.log(
        `   - ${user.nostrPublicKey?.substring(0, 16)}... (${user.id})`
      );
    });

    // Verify the migration
    const totalUsers = await db.select().from(users);
    const emailUsers = totalUsers.filter((u) => u.authType === "email");
    const nostrUsers = totalUsers.filter((u) => u.authType === "nostr");

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total users: ${totalUsers.length}`);
    console.log(`   Email users: ${emailUsers.length}`);
    console.log(`   Nostr users: ${nostrUsers.length}`);

    // Security check: Ensure no Nostr users have private keys stored
    const nostrUsersWithPrivateKeys = nostrUsers.filter(
      (u) => u.nostrPrivateKey
    );
    if (nostrUsersWithPrivateKeys.length > 0) {
      console.warn(
        `⚠️  Warning: ${nostrUsersWithPrivateKeys.length} Nostr users still have private keys stored!`
      );
      console.log("   This is a security issue that should be addressed.");
    } else {
      console.log(
        `🔒 Security check passed: No Nostr users have private keys stored`
      );
    }

    console.log(`\n🎉 User auth type migration completed successfully!`);
    return {
      totalUsers: totalUsers.length,
      emailUsers: emailUsers.length,
      nostrUsers: nostrUsers.length,
      securityIssues: nostrUsersWithPrivateKeys.length,
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateExistingUsers()
    .then((result) => {
      console.log("Migration completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
