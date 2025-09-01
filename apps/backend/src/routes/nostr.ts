import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc";
import { db, nostrRelays, eq, and } from "@deadmansswitch/database";
import { nostrService } from "@/services/nostr";

export const nostrRouter = createTRPCRouter({
  // Get user's Nostr relays
  getRelays: protectedProcedure.query(async ({ ctx }) => {
    const relays = await db
      .select()
      .from(nostrRelays)
      .where(eq(nostrRelays.userId, ctx.user.userId));

    return relays;
  }),

  // Add a new Nostr relay
  addRelay: protectedProcedure
    .input(
      z.object({
        url: z.string().url("Must be a valid URL"),
        name: z.string().min(1, "Name is required").max(100, "Name too long"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { url, name } = input;

      // Validate WebSocket URL
      if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Relay URL must start with ws:// or wss://",
        });
      }

      // Check if relay already exists for this user
      const existingRelay = await db
        .select()
        .from(nostrRelays)
        .where(
          and(eq(nostrRelays.userId, ctx.user.userId), eq(nostrRelays.url, url))
        );

      if (existingRelay.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Relay already exists",
        });
      }

      // Test relay connectivity
      const isConnectable = await nostrService.testRelayConnectivity(url);
      if (!isConnectable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unable to connect to relay. Please check the URL.",
        });
      }

      // Add relay
      const [newRelay] = await db
        .insert(nostrRelays)
        .values({
          userId: ctx.user.userId,
          url,
          name,
          isActive: true,
        })
        .returning();

      return newRelay;
    }),

  // Update relay (name or active status)
  updateRelay: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, isActive } = input;

      // Verify ownership
      const [existingRelay] = await db
        .select()
        .from(nostrRelays)
        .where(
          and(eq(nostrRelays.id, id), eq(nostrRelays.userId, ctx.user.userId))
        );

      if (!existingRelay) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Relay not found",
        });
      }

      // Update relay
      const updateData: Partial<typeof nostrRelays.$inferInsert> = {};
      if (name !== undefined) updateData.name = name;
      if (isActive !== undefined) updateData.isActive = isActive;

      const [updatedRelay] = await db
        .update(nostrRelays)
        .set(updateData)
        .where(eq(nostrRelays.id, id))
        .returning();

      return updatedRelay;
    }),

  // Delete relay
  deleteRelay: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Verify ownership
      const [existingRelay] = await db
        .select()
        .from(nostrRelays)
        .where(
          and(eq(nostrRelays.id, id), eq(nostrRelays.userId, ctx.user.userId))
        );

      if (!existingRelay) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Relay not found",
        });
      }

      await db.delete(nostrRelays).where(eq(nostrRelays.id, id));

      return { success: true };
    }),

  // Test relay connectivity
  testRelay: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const { url } = input;

      // Validate WebSocket URL
      if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Relay URL must start with ws:// or wss://",
        });
      }

      const isConnectable = await nostrService.testRelayConnectivity(url);

      return {
        url,
        isConnectable,
        message: isConnectable
          ? "Relay is reachable"
          : "Unable to connect to relay",
      };
    }),

  // Get default relays (for users who haven't configured any)
  getDefaultRelays: protectedProcedure.query(() => {
    return nostrService.getDefaultRelays().map((url) => ({
      url,
      name: url.replace("wss://", "").replace("ws://", ""),
      isDefault: true,
    }));
  }),
});
