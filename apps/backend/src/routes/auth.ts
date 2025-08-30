import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/lib/trpc";
import { db } from "@/db/connection";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  generateTempPassword,
  generateToken,
  generateNostrKeypair,
  encryptData,
  decryptData,
} from "@/lib/auth";
import { sendTempPasswordEmail } from "@/services/email";
import { verifyNostrSignature } from "@/lib/nostr";

export const authRouter = createTRPCRouter({
  // Email-based authentication - request temp password
  requestEmailAuth: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const { email } = input;

      try {
        // Check if user exists, create if not
        let [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user) {
          // Create new user with Nostr keypair (email auth users get generated keys)
          const keypair = await generateNostrKeypair();

          [user] = await db
            .insert(users)
            .values({
              email,
              authType: "email", // Email-authenticated users get generated keys
              nostrPrivateKey: encryptData(keypair.privateKey), // Encrypted storage for email users
              nostrPublicKey: keypair.publicKey,
              tier: "free",
            })
            .returning();
        }

        // Generate temporary password
        const tempPassword = generateTempPassword();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with temp password
        await db
          .update(users)
          .set({
            tempPassword,
            tempPasswordExpires: expiresAt,
          })
          .where(eq(users.id, user.id));

        // Send email with temp password
        await sendTempPasswordEmail(email, tempPassword);

        return {
          success: true,
          message: "Temporary password sent to your email",
        };
      } catch (error) {
        console.error("Email auth error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send temporary password",
        });
      }
    }),

  // Email-based authentication - login with temp password
  loginWithEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        tempPassword: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { email, tempPassword } = input;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (!user.tempPassword || !user.tempPasswordExpires) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No valid temporary password found",
        });
      }

      if (user.tempPassword !== tempPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid temporary password",
        });
      }

      if (new Date() > user.tempPasswordExpires) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Temporary password expired",
        });
      }

      // Update last check-in
      await db
        .update(users)
        .set({
          lastCheckIn: new Date(),
          tempPassword: null, // Clear temp password after use
          tempPasswordExpires: null,
        })
        .where(eq(users.id, user.id));

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email!,
        nostrPublicKey: user.nostrPublicKey!,
        tier: user.tier as "free" | "premium" | "lifetime",
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          nostrPublicKey: user.nostrPublicKey,
          tier: user.tier,
        },
      };
    }),

  // Nostr-based authentication
  loginWithNostr: publicProcedure
    .input(
      z.object({
        publicKey: z.string(),
        signature: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { publicKey, signature, message } = input;

      // Verify Nostr signature
      const isValidSignature = await verifyNostrSignature(
        publicKey,
        signature,
        message
      );

      if (!isValidSignature) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Nostr signature",
        });
      }

      // Check if user exists, create if not
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.nostrPublicKey, publicKey));

      if (!user) {
        [user] = await db
          .insert(users)
          .values({
            authType: "nostr", // Nostr-authenticated users bring their own keys
            nostrPublicKey: publicKey,
            // nostrPrivateKey: null (explicitly not storing private keys for nostr users)
            tier: "free",
          })
          .returning();
      }

      // Update last check-in
      await db
        .update(users)
        .set({
          lastCheckIn: new Date(),
        })
        .where(eq(users.id, user.id));

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email || undefined,
        nostrPublicKey: user.nostrPublicKey!,
        tier: user.tier as "free" | "premium" | "lifetime",
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          nostrPublicKey: user.nostrPublicKey,
          tier: user.tier,
        },
      };
    }),

  // Check-in endpoint (extends deadline)
  checkIn: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(users)
      .set({
        lastCheckIn: new Date(),
      })
      .where(eq(users.id, ctx.user.id));

    return {
      success: true,
      lastCheckIn: new Date(),
    };
  }),

  // Export Nostr keys (ONLY for email-authenticated users)
  exportNostrKeys: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id));

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Only email-authenticated users can export keys (they have generated keys)
    if (user.authType !== "email") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Key export is only available for email-authenticated users. Nostr users already have their keys.",
      });
    }

    if (!user.nostrPrivateKey) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No private key found. It may have already been exported.",
      });
    }

    // Decrypt private key
    const privateKey = decryptData(user.nostrPrivateKey);

    // Immediately wipe the keys from database after export
    await db
      .update(users)
      .set({
        nostrPrivateKey: null,
      })
      .where(eq(users.id, ctx.user.id));

    return {
      privateKey,
      publicKey: user.nostrPublicKey,
      warning:
        "🔑 Keys have been permanently removed from our servers. Store them safely!",
      recommendation:
        "Import these keys into a Nostr client like Damus, Amethyst, or Nostter.",
    };
  }),

  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id));

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      id: user.id,
      email: user.email,
      authType: user.authType,
      nostrPublicKey: user.nostrPublicKey,
      tier: user.tier,
      lastCheckIn: user.lastCheckIn,
      hasNostrKeys: !!user.nostrPrivateKey, // Only true for email users who haven't exported
      canExportKeys: user.authType === "email" && !!user.nostrPrivateKey,
      createdAt: user.createdAt,
    };
  }),
});
