import * as cron from "node-cron";
import { db } from "../db/connection";
import { users, deadmanEmails, emailRecipients, auditLogs } from "../db/schema";
import { eq, and, lt, lte, isNull, isNotNull } from "drizzle-orm";
import { sendDeadmanEmail } from "../services/email";
import { nostrService } from "../services/nostr";
import { decryptData } from "../lib/auth";

export function startCronJobs() {
  console.log("🕐 Starting cron jobs...");

  // Check for emails to send every hour
  cron.schedule("0 * * * *", async () => {
    await checkAndSendScheduledEmails();
  });

  // Check for inactivity-based emails every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    await checkInactivityEmails();
  });

  // Clean up expired temp passwords daily
  cron.schedule("0 2 * * *", async () => {
    await cleanupExpiredPasswords();
  });

  console.log("✅ Cron jobs started successfully");
}

async function checkAndSendScheduledEmails() {
  console.log("🔍 Checking for scheduled emails to send...");

  try {
    const now = new Date();

    // Find emails scheduled to be sent now
    const scheduledEmails = await db
      .select({
        email: deadmanEmails,
        user: users,
      })
      .from(deadmanEmails)
      .innerJoin(users, eq(deadmanEmails.userId, users.id))
      .where(
        and(
          eq(deadmanEmails.isActive, true),
          eq(deadmanEmails.isSent, false),
          isNotNull(deadmanEmails.scheduledFor),
          lte(deadmanEmails.scheduledFor, now)
        )
      );

    console.log(`📧 Found ${scheduledEmails.length} scheduled emails to send`);

    for (const { email, user } of scheduledEmails) {
      await sendEmail(email, user);
    }

    console.log("⏰ Scheduled email check completed");
  } catch (error) {
    console.error("❌ Error checking scheduled emails:", error);
  }
}

async function checkInactivityEmails() {
  console.log("🔍 Checking for inactivity-based emails...");

  try {
    const now = new Date();

    // Find emails based on inactivity periods
    const inactivityEmails = await db
      .select({
        email: deadmanEmails,
        user: users,
      })
      .from(deadmanEmails)
      .innerJoin(users, eq(deadmanEmails.userId, users.id))
      .where(
        and(
          eq(deadmanEmails.isActive, true),
          eq(deadmanEmails.isSent, false),
          isNotNull(deadmanEmails.intervalDays),
          isNull(deadmanEmails.scheduledFor)
        )
      );

    console.log(
      `📧 Checking ${inactivityEmails.length} inactivity-based emails`
    );

    for (const { email, user } of inactivityEmails) {
      if (!user.lastCheckIn || !email.intervalDays) continue;

      const daysSinceCheckIn = Math.floor(
        (now.getTime() - user.lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCheckIn >= email.intervalDays) {
        await sendEmail(email, user);
      }
    }

    console.log("⏰ Inactivity email check completed");
  } catch (error) {
    console.error("❌ Error checking inactivity emails:", error);
  }
}

async function sendEmail(
  email: typeof deadmanEmails.$inferSelect,
  user: typeof users.$inferSelect
) {
  console.log(`📤 Sending email: ${email.title} for user: ${user.id}`);

  try {
    // Get recipients
    const recipients = await db
      .select()
      .from(emailRecipients)
      .where(eq(emailRecipients.deadmanEmailId, email.id));

    if (recipients.length === 0) {
      console.warn(`No recipients found for email ${email.id}`);
      return;
    }

    // Get email content from Nostr
    let emailContent = null;
    let emailSubject = "Dead Man's Switch Notification";

    if (email.nostrEventId && user.nostrPrivateKey) {
      try {
        const privateKey = decryptData(user.nostrPrivateKey);
        const userRelays = await nostrService.getUserRelays(user.id);

        emailContent = await nostrService.retrieveEncryptedEmail(
          email.nostrEventId,
          privateKey,
          userRelays.length > 0 ? userRelays : undefined
        );

        if (emailContent) {
          emailSubject = emailContent.subject;
        }
      } catch (error) {
        console.error(
          `Failed to retrieve email content from Nostr for ${email.id}:`,
          error
        );
      }
    }

    // Send to each recipient
    const sentResults = [];
    for (const recipient of recipients) {
      try {
        const recipientEmail = decryptData(recipient.encryptedEmail);
        const recipientName = recipient.encryptedName
          ? decryptData(recipient.encryptedName)
          : null;

        await sendDeadmanEmail(
          recipientEmail,
          emailSubject,
          emailContent?.content ||
            "This is an automated message from a Dead Man's Switch.",
          recipientName || user.email || "A friend"
        );

        sentResults.push({ success: true, recipient: recipientEmail });
        console.log(`✅ Email sent to ${recipientEmail}`);
      } catch (error) {
        console.error(`Failed to send email to recipient:`, error);
        sentResults.push({
          success: false,
          recipient: "unknown",
          error: error.message,
        });
      }
    }

    // Mark email as sent
    await db
      .update(deadmanEmails)
      .set({
        isSent: true,
        sentAt: new Date(),
        updatedAt: new Date(),
      } as any) // Type assertion to handle Drizzle ORM type inference issues
      .where(eq(deadmanEmails.id, email.id));

    // Send notification via Nostr if possible
    if (user.nostrPrivateKey && emailContent) {
      try {
        const privateKey = decryptData(user.nostrPrivateKey);
        const userRelays = await nostrService.getUserRelays(user.id);

        await nostrService.sendDeadmanEmailViaNostr(
          {
            subject: emailSubject,
            content: emailContent.content,
            recipients: sentResults
              .filter((r) => r.success)
              .map((r) => r.recipient),
          },
          privateKey,
          userRelays.length > 0 ? userRelays : undefined
        );
      } catch (error) {
        console.error("Failed to send Nostr notification:", error);
      }
    }

    // Log the action
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "email_sent",
      details: JSON.stringify({
        emailId: email.id,
        title: email.title,
        recipientCount: recipients.length,
        successCount: sentResults.filter((r) => r.success).length,
        results: sentResults,
      }),
    } as any);

    console.log(`🎉 Successfully processed email ${email.id}`);
  } catch (error) {
    console.error(`Failed to send email ${email.id}:`, error);

    // Log the error
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "email_send_failed",
      details: JSON.stringify({
        emailId: email.id,
        title: email.title,
        error: error.message,
      }),
    } as any);
  }
}

async function cleanupExpiredPasswords() {
  console.log("🧹 Cleaning up expired temporary passwords...");

  try {
    const now = new Date();

    const result = await db
      .update(users)
      .set({
        tempPassword: null,
        tempPasswordExpires: null,
      })
      .where(
        and(
          isNotNull(users.tempPasswordExpires),
          lt(users.tempPasswordExpires, now)
        )
      );

    console.log(`🗑️ Cleaned up expired passwords`);
  } catch (error) {
    console.error("❌ Error cleaning up expired passwords:", error);
  }
}
