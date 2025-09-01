import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc";
import {
  db,
  deadmanEmails,
  emailRecipients,
  users,
  eq,
  and,
} from "@deadmansswitch/database";
import { count } from "drizzle-orm";
import { encryptData, decryptData } from "@/lib/auth";
import { nostrService } from "@/services/nostr";

// Tier limits
const TIER_LIMITS = {
  free: {
    maxEmails: 2,
    maxRecipients: 2,
    maxSubjectLength: 125,
    maxContentLength: 2000,
    maxRelays: 1, // Limited to single relay - less decentralization
  },
  premium: {
    maxEmails: 100,
    maxRecipients: 10,
    maxSubjectLength: 300,
    maxContentLength: 10000,
    maxRelays: 5, // Multiple relays for better decentralization
  },
  lifetime: {
    maxEmails: 100,
    maxRecipients: 10,
    maxSubjectLength: 300,
    maxContentLength: 10000,
    maxRelays: 10, // Maximum relays for best decentralization
  },
};

export const emailsRouter = createTRPCRouter({
  // Get user's tier limits
  getTierLimits: protectedProcedure.query(({ ctx }) => {
    return TIER_LIMITS[ctx.user.tier];
  }),

  // Get all user's emails
  getEmails: protectedProcedure.query(async ({ ctx }) => {
    const emails = await db
      .select({
        id: deadmanEmails.id,
        title: deadmanEmails.title,
        recipientCount: deadmanEmails.recipientCount,
        scheduledFor: deadmanEmails.scheduledFor,
        intervalDays: deadmanEmails.intervalDays,
        isActive: deadmanEmails.isActive,
        isSent: deadmanEmails.isSent,
        sentAt: deadmanEmails.sentAt,
        createdAt: deadmanEmails.createdAt,
        updatedAt: deadmanEmails.updatedAt,
      })
      .from(deadmanEmails)
      .where(eq(deadmanEmails.userId, ctx.user.userId));

    return emails;
  }),

  // Get single email with recipients (returns encrypted data for client-side decryption)
  getEmail: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      // Get email
      const [email] = await db
        .select()
        .from(deadmanEmails)
        .where(
          and(
            eq(deadmanEmails.id, id),
            eq(deadmanEmails.userId, ctx.user.userId)
          )
        );

      if (!email) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email not found",
        });
      }

      // Get encrypted recipients (keep as encrypted for client-side decryption)
      const encryptedRecipients = await db
        .select()
        .from(emailRecipients)
        .where(eq(emailRecipients.deadmanEmailId, id));

      // Get encrypted content from Nostr if event ID exists
      let encryptedContent = null;
      let encryptionMetadata = null;

      if (email.nostrEventId) {
        try {
          const userRelays = await nostrService.getUserRelays(ctx.user.userId);
          const rawEventData = await nostrService.retrieveRawEvent(
            email.nostrEventId,
            userRelays.length > 0 ? userRelays : undefined
          );

          if (rawEventData) {
            encryptedContent = rawEventData.content;
            encryptionMetadata = {
              eventId: email.nostrEventId,
              tags: rawEventData.tags,
              kind: rawEventData.kind,
            };
          }
        } catch (error) {
          console.error(
            "Failed to retrieve encrypted email content from Nostr:",
            error
          );
        }
      }

      return {
        ...email,
        // Return encrypted data for client-side decryption
        encryptedContent,
        encryptionMetadata,
        encryptedRecipients:
          encryptedRecipients.length > 0
            ? encryptedRecipients[0].encryptedEmail
            : null,
        // Legacy fields for backward compatibility (will be null for new encrypted emails)
        subject: null,
        content: null,
        recipients: [],
      };
    }),

  // Create new email (with client-side encryption)
  createEmail: protectedProcedure
    .input(
      z.object({
        title: z
          .string()
          .min(1, "Title is required")
          .max(255, "Title too long"),
        // Client-side encrypted fields
        encryptedSubject: z.string().min(1, "Encrypted subject is required"),
        encryptedContent: z.string().min(1, "Encrypted content is required"),
        encryptedRecipients: z
          .string()
          .min(1, "Encrypted recipients are required"),
        encryptionMethod: z.enum([
          "browser-extension",
          "local-keys",
          "fallback",
        ]),
        publicKey: z.string().min(1, "Public key is required"),
        recipientCount: z
          .number()
          .int()
          .positive()
          .min(1, "At least one recipient is required"),
        scheduledFor: z.date().optional(),
        intervalDays: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const {
        title,
        encryptedSubject,
        encryptedContent,
        encryptedRecipients,
        encryptionMethod,
        publicKey,
        recipientCount,
        scheduledFor,
        intervalDays,
      } = input;

      const limits = TIER_LIMITS[ctx.user.tier];

      // Note: We can't validate encrypted content length directly
      // Content length validation should be done on the client-side before encryption

      // Parse encrypted recipients to validate count (this assumes we can decrypt or the client sends count)
      // For now, we'll trust the client-side validation and add server-side recipient count check later
      // TODO: Add more robust validation for encrypted data

      // Check current email count
      const [emailCount] = await db
        .select({ count: count() })
        .from(deadmanEmails)
        .where(eq(deadmanEmails.userId, ctx.user.userId));

      if (emailCount.count >= limits.maxEmails) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Email limit reached. Maximum ${limits.maxEmails} emails allowed.`,
        });
      }

      // Validate scheduling
      if (scheduledFor && intervalDays) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot specify both scheduled date and interval days",
        });
      }

      if (!scheduledFor && !intervalDays) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must specify either scheduled date or interval days",
        });
      }

      try {
        // Store pre-encrypted email data in Nostr
        // Data is already encrypted on the client-side, so we just need to store it
        const nostrEventId = await nostrService.storePreEncryptedEmail(
          ctx.user.userId,
          {
            encryptedSubject,
            encryptedContent,
            encryptedRecipients,
            encryptionMethod,
            publicKey,
          }
        );

        // Create email record
        const [newEmail] = await db
          .insert(deadmanEmails)
          .values({
            userId: ctx.user.userId,
            title,
            recipientCount: recipientCount,
            scheduledFor,
            intervalDays,
            nostrEventId,
            isActive: true,
          })
          .returning();

        // Create encrypted recipient record
        // Since recipients are already encrypted as a single payload on client-side,
        // we store them as a single encrypted blob
        await db.insert(emailRecipients).values({
          deadmanEmailId: newEmail.id,
          encryptedEmail: encryptedRecipients, // Already encrypted on client-side
          encryptedName: null, // Names are included in the encrypted recipients payload
        });

        return newEmail;
      } catch (error) {
        console.error("Failed to create email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create email",
        });
      }
    }),

  // Update email
  updateEmail: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        subject: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        recipients: z
          .array(
            z.object({
              email: z.string().email(),
              name: z.string().optional(),
            })
          )
          .optional(),
        scheduledFor: z.date().optional().nullable(),
        intervalDays: z.number().int().positive().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const {
        id,
        title,
        subject,
        content,
        recipients,
        scheduledFor,
        intervalDays,
        isActive,
      } = input;

      // Verify ownership
      const [existingEmail] = await db
        .select()
        .from(deadmanEmails)
        .where(
          and(
            eq(deadmanEmails.id, id),
            eq(deadmanEmails.userId, ctx.user.userId)
          )
        );

      if (!existingEmail) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email not found",
        });
      }

      if (existingEmail.isSent) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot update sent email",
        });
      }

      const limits = TIER_LIMITS[ctx.user.tier];

      // Validate limits if content is being updated
      if (subject && subject.length > limits.maxSubjectLength) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Subject too long. Maximum ${limits.maxSubjectLength} characters allowed.`,
        });
      }

      if (content && content.length > limits.maxContentLength) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Content too long. Maximum ${limits.maxContentLength} characters allowed.`,
        });
      }

      if (recipients && recipients.length > limits.maxRecipients) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Too many recipients. Maximum ${limits.maxRecipients} allowed.`,
        });
      }

      try {
        // If content or recipients are being updated, update Nostr as well
        if ((subject || content || recipients) && existingEmail.nostrEventId) {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, ctx.user.userId));

          if (user?.nostrPrivateKey) {
            const privateKey = decryptData(user.nostrPrivateKey);

            // Get current data first
            const userRelays = await nostrService.getUserRelays(
              ctx.user.userId
            );
            const currentData = await nostrService.retrieveEncryptedEmail(
              existingEmail.nostrEventId,
              privateKey,
              userRelays.length > 0 ? userRelays : undefined
            );

            // Update with new data
            const updatedData = {
              subject: subject || currentData?.subject || "",
              content: content || currentData?.content || "",
              recipients: recipients?.map((r) => r.email) || [] || [],
            };

            // Store updated data in Nostr
            const newNostrEventId = await nostrService.storeEncryptedEmail(
              ctx.user.userId,
              updatedData,
              privateKey
            );

            // Update the nostrEventId in database
            existingEmail.nostrEventId = newNostrEventId;
          }
        }

        // Update email record
        const updateData: Partial<typeof deadmanEmails.$inferInsert> = {
          updatedAt: new Date(),
        };

        if (title !== undefined) updateData.title = title;
        if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor;
        if (intervalDays !== undefined) updateData.intervalDays = intervalDays;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (recipients !== undefined)
          updateData.recipientCount = recipients.length;
        if (existingEmail.nostrEventId)
          updateData.nostrEventId = existingEmail.nostrEventId;

        const [updatedEmail] = await db
          .update(deadmanEmails)
          .set(updateData)
          .where(eq(deadmanEmails.id, id))
          .returning();

        // Update recipients if provided
        if (recipients) {
          // Delete existing recipients
          await db
            .delete(emailRecipients)
            .where(eq(emailRecipients.deadmanEmailId, id));

          // Insert new recipients
          for (const recipient of recipients) {
            await db.insert(emailRecipients).values({
              deadmanEmailId: id,
              encryptedEmail: encryptData(recipient.email),
              encryptedName: recipient.name
                ? encryptData(recipient.name)
                : null,
            });
          }
        }

        return updatedEmail;
      } catch (error) {
        console.error("Failed to update email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update email",
        });
      }
    }),

  // Delete email
  deleteEmail: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Verify ownership
      const [existingEmail] = await db
        .select()
        .from(deadmanEmails)
        .where(
          and(
            eq(deadmanEmails.id, id),
            eq(deadmanEmails.userId, ctx.user.userId)
          )
        );

      if (!existingEmail) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email not found",
        });
      }

      if (existingEmail.isSent) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete sent email",
        });
      }

      // Delete recipients (will cascade)
      await db
        .delete(emailRecipients)
        .where(eq(emailRecipients.deadmanEmailId, id));

      // Delete email
      await db.delete(deadmanEmails).where(eq(deadmanEmails.id, id));

      return { success: true };
    }),

  // Preview email (test mode)
  previewEmail: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      // Get email with full content (same as getEmail but for preview)
      const emailData = await ctx.db
        .select()
        .from(deadmanEmails)
        .where(
          and(
            eq(deadmanEmails.id, id),
            eq(deadmanEmails.userId, ctx.user.userId)
          )
        );

      if (!emailData.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email not found",
        });
      }

      return {
        message: "This is how your email will look when sent",
        canTest: true,
      };
    }),
});
