import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  MockedFunction,
} from "vitest";
import * as cron from "node-cron";
import { startCronJobs } from "./scheduler";
import {
  db,
  users,
  deadmanEmails,
  emailRecipients,
  auditLogs,
} from "@deadmansswitch/database";
import { sendDeadmanEmail } from "../services/email";
import { nostrService } from "../services/nostr";
import { decryptData } from "../lib/auth";

// Mock all dependencies
vi.mock("node-cron");
vi.mock("../db/connection");
vi.mock("../services/email");
vi.mock("../services/nostr");
vi.mock("../lib/auth");

const mockedCron = vi.mocked(cron);
const mockedSendDeadmanEmail = vi.mocked(sendDeadmanEmail);
const mockedNostrService = vi.mocked(nostrService);
const mockedDecryptData = vi.mocked(decryptData);

// Mock database operations
const mockDbOperations = {
  select: vi.fn(),
  from: vi.fn(),
  innerJoin: vi.fn(),
  where: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
};

// Create chainable mock
const createMockChain = () => ({
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: mockDbOperations.where,
      }),
      where: mockDbOperations.where,
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  }),
  insert: vi.fn().mockReturnValue({
    values: mockDbOperations.values,
  }),
});

// Mock the db object
Object.assign(db, createMockChain());

describe("Cron Scheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock database operations
    mockDbOperations.where.mockResolvedValue([]);
    mockDbOperations.values.mockResolvedValue({});

    // Reset the db object with fresh mocks
    Object.assign(db, createMockChain());

    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("startCronJobs", () => {
    it("should schedule all cron jobs and log startup", () => {
      mockedCron.schedule = vi.fn();

      startCronJobs();

      expect(console.log).toHaveBeenCalledWith("🕐 Starting cron jobs...");
      expect(console.log).toHaveBeenCalledWith(
        "✅ Cron jobs started successfully"
      );

      // Check that all three cron jobs are scheduled
      expect(mockedCron.schedule).toHaveBeenCalledTimes(3);

      // Verify cron job schedules
      expect(mockedCron.schedule).toHaveBeenNthCalledWith(
        1,
        "0 * * * *", // Every hour
        expect.any(Function)
      );
      expect(mockedCron.schedule).toHaveBeenNthCalledWith(
        2,
        "0 */6 * * *", // Every 6 hours
        expect.any(Function)
      );
      expect(mockedCron.schedule).toHaveBeenNthCalledWith(
        3,
        "0 2 * * *", // Daily at 2 AM
        expect.any(Function)
      );
    });
  });

  describe("checkAndSendScheduledEmails", () => {
    it("should find and send scheduled emails", async () => {
      const mockScheduledEmails = [
        {
          email: {
            id: "email1",
            userId: "user1",
            title: "Test Email 1",
            scheduledFor: new Date(),
            nostrEventId: "event1",
          },
          user: {
            id: "user1",
            email: "user@example.com",
            nostrPrivateKey: "encrypted-key",
          },
        },
      ];

      const mockRecipients = [
        {
          id: "recipient1",
          deadmanEmailId: "email1",
          encryptedEmail: "encrypted-recipient@example.com",
          encryptedName: "encrypted-name",
        },
      ];

      // Mock database queries
      mockDbOperations.where.mockResolvedValueOnce(mockScheduledEmails);
      mockDbOperations.where.mockResolvedValueOnce(mockRecipients);

      // Mock decryption
      mockedDecryptData
        .mockReturnValueOnce("decrypted-key")
        .mockReturnValueOnce("recipient@example.com")
        .mockReturnValueOnce("Recipient Name")
        .mockReturnValueOnce("decrypted-key");

      // Mock Nostr service
      mockedNostrService.getUserRelays.mockResolvedValue([
        "wss://relay.example.com",
      ]);
      mockedNostrService.retrieveEncryptedEmail.mockResolvedValue({
        subject: "Test Subject",
        content: "Test Content",
      });
      mockedNostrService.sendDeadmanEmailViaNostr.mockResolvedValue(undefined);

      // Mock email service
      mockedSendDeadmanEmail.mockResolvedValue(true);

      // Import and run the private function by capturing it from cron.schedule
      startCronJobs();
      const scheduledFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[0][1];
      await (scheduledFunction as any)();

      expect(console.log).toHaveBeenCalledWith(
        "🔍 Checking for scheduled emails to send..."
      );
      expect(console.log).toHaveBeenCalledWith(
        "📧 Found 1 scheduled emails to send"
      );
      expect(console.log).toHaveBeenCalledWith(
        "⏰ Scheduled email check completed"
      );
    });

    it("should handle errors during scheduled email check", async () => {
      const error = new Error("Database error");
      mockDbOperations.where.mockRejectedValue(error);

      startCronJobs();
      const scheduledFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[0][1];
      await (scheduledFunction as any)();

      expect(console.error).toHaveBeenCalledWith(
        "❌ Error checking scheduled emails:",
        error
      );
    });
  });

  describe("checkInactivityEmails", () => {
    it("should check and send inactivity-based emails", async () => {
      const mockInactivityEmails = [
        {
          email: {
            id: "email2",
            userId: "user2",
            title: "Inactivity Email",
            intervalDays: 7,
            nostrEventId: "event2",
          },
          user: {
            id: "user2",
            email: "user2@example.com",
            lastCheckIn: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
            nostrPrivateKey: "encrypted-key",
          },
        },
      ];

      const mockRecipients = [
        {
          id: "recipient2",
          deadmanEmailId: "email2",
          encryptedEmail: "encrypted-recipient2@example.com",
          encryptedName: null,
        },
      ];

      // Mock database queries
      mockDbOperations.where.mockResolvedValueOnce(mockInactivityEmails);
      mockDbOperations.where.mockResolvedValueOnce(mockRecipients);

      // Mock decryption
      mockedDecryptData
        .mockReturnValueOnce("decrypted-key")
        .mockReturnValueOnce("recipient2@example.com")
        .mockReturnValueOnce("decrypted-key");

      // Mock Nostr service
      mockedNostrService.getUserRelays.mockResolvedValue([]);
      mockedNostrService.retrieveEncryptedEmail.mockResolvedValue({
        subject: "Inactivity Alert",
        content: "You haven't checked in",
      });
      mockedNostrService.sendDeadmanEmailViaNostr.mockResolvedValue(undefined);

      // Mock email service
      mockedSendDeadmanEmail.mockResolvedValue(true);

      startCronJobs();
      const inactivityFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[1][1];
      await (inactivityFunction as any)();

      expect(console.log).toHaveBeenCalledWith(
        "🔍 Checking for inactivity-based emails..."
      );
      expect(console.log).toHaveBeenCalledWith(
        "📧 Checking 1 inactivity-based emails"
      );
      expect(console.log).toHaveBeenCalledWith(
        "⏰ Inactivity email check completed"
      );
    });

    it("should skip emails when user hasn't been inactive long enough", async () => {
      const mockInactivityEmails = [
        {
          email: {
            id: "email3",
            userId: "user3",
            title: "Inactivity Email",
            intervalDays: 7,
          },
          user: {
            id: "user3",
            lastCheckIn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          },
        },
      ];

      mockDbOperations.where.mockResolvedValue(mockInactivityEmails);

      startCronJobs();
      const inactivityFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[1][1];
      await (inactivityFunction as any)();

      // Should not attempt to send email since 5 days < 7 days
      expect(mockedSendDeadmanEmail).not.toHaveBeenCalled();
    });

    it("should handle errors during inactivity email check", async () => {
      const error = new Error("Network error");
      mockDbOperations.where.mockRejectedValue(error);

      startCronJobs();
      const inactivityFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[1][1];
      await (inactivityFunction as any)();

      expect(console.error).toHaveBeenCalledWith(
        "❌ Error checking inactivity emails:",
        error
      );
    });
  });

  describe("sendEmail function", () => {
    const mockEmail = {
      id: "email-id",
      title: "Test Email",
      nostrEventId: "event-id",
      userId: "user-id",
    };

    const mockUser = {
      id: "user-id",
      email: "user@example.com",
      nostrPrivateKey: "encrypted-private-key",
    };

    const mockRecipients = [
      {
        id: "recipient-id",
        deadmanEmailId: "email-id",
        encryptedEmail: "encrypted-email",
        encryptedName: "encrypted-name",
      },
    ];

    beforeEach(() => {
      mockDbOperations.where.mockResolvedValue(mockRecipients);
      mockedDecryptData
        .mockReturnValueOnce("decrypted-private-key")
        .mockReturnValueOnce("recipient@example.com")
        .mockReturnValueOnce("Recipient Name")
        .mockReturnValueOnce("decrypted-private-key");
    });

    it("should send email successfully with Nostr content", async () => {
      const mockEmailContent = {
        subject: "Custom Subject",
        content: "Custom Content",
      };

      mockedNostrService.getUserRelays.mockResolvedValue([
        "wss://relay.example.com",
      ]);
      mockedNostrService.retrieveEncryptedEmail.mockResolvedValue(
        mockEmailContent
      );
      mockedNostrService.sendDeadmanEmailViaNostr.mockResolvedValue(undefined);
      mockedSendDeadmanEmail.mockResolvedValue(true);

      // Call sendEmail through scheduled function
      const mockScheduledEmails = [{ email: mockEmail, user: mockUser }];
      mockDbOperations.where.mockResolvedValueOnce(mockScheduledEmails);

      startCronJobs();
      const scheduledFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[0][1];
      await (scheduledFunction as any)();

      expect(mockedSendDeadmanEmail).toHaveBeenCalledWith(
        "recipient@example.com",
        "Custom Subject",
        "Custom Content",
        "Recipient Name"
      );

      expect(console.log).toHaveBeenCalledWith(
        `📤 Sending email: ${mockEmail.title} for user: ${mockUser.id}`
      );
      expect(console.log).toHaveBeenCalledWith(
        "✅ Email sent to recipient@example.com"
      );
      expect(console.log).toHaveBeenCalledWith(
        `🎉 Successfully processed email ${mockEmail.id}`
      );
    });

    it("should handle case with no recipients", async () => {
      mockDbOperations.where.mockResolvedValueOnce([
        { email: mockEmail, user: mockUser },
      ]);
      mockDbOperations.where.mockResolvedValueOnce([]); // No recipients

      startCronJobs();
      const scheduledFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[0][1];
      await (scheduledFunction as any)();

      expect(console.warn).toHaveBeenCalledWith(
        `No recipients found for email ${mockEmail.id}`
      );
      expect(mockedSendDeadmanEmail).not.toHaveBeenCalled();
    });

    it("should handle email sending failure", async () => {
      const sendError = new Error("SMTP connection failed");
      mockedSendDeadmanEmail.mockRejectedValue(sendError);

      const mockScheduledEmails = [{ email: mockEmail, user: mockUser }];
      mockDbOperations.where.mockResolvedValueOnce(mockScheduledEmails);

      startCronJobs();
      const scheduledFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[0][1];
      await (scheduledFunction as any)();

      expect(console.error).toHaveBeenCalledWith(
        "Failed to send email to recipient:",
        sendError
      );
    });

    it("should handle Nostr retrieval failure gracefully", async () => {
      const nostrError = new Error("Nostr relay unavailable");
      mockedNostrService.retrieveEncryptedEmail.mockRejectedValue(nostrError);
      mockedSendDeadmanEmail.mockResolvedValue(true);

      const mockScheduledEmails = [{ email: mockEmail, user: mockUser }];
      mockDbOperations.where.mockResolvedValueOnce(mockScheduledEmails);

      startCronJobs();
      const scheduledFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[0][1];
      await (scheduledFunction as any)();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to retrieve email content from Nostr"),
        expect.any(Error)
      );

      // Should still send email with default content
      expect(mockedSendDeadmanEmail).toHaveBeenCalledWith(
        "recipient@example.com",
        "Dead Man's Switch Notification",
        "This is an automated message from a Dead Man's Switch.",
        "Recipient Name"
      );
    });

    it("should handle complete email sending failure", async () => {
      const fatalError = new Error("Complete failure");
      mockDbOperations.where.mockResolvedValueOnce([
        { email: mockEmail, user: mockUser },
      ]);
      mockDbOperations.where.mockResolvedValueOnce(mockRecipients);

      // Mock getUserRelays to return empty array initially for nostr operations
      mockedNostrService.getUserRelays.mockResolvedValue([]);
      mockedNostrService.retrieveEncryptedEmail.mockResolvedValue(null);

      // Mock sendDeadmanEmail to throw error
      mockedSendDeadmanEmail.mockRejectedValue(fatalError);

      // Mock decryptData for normal recipient decryption
      mockedDecryptData
        .mockReturnValueOnce("decrypted-private-key") // For user.nostrPrivateKey
        .mockReturnValueOnce("recipient@example.com") // For recipient.encryptedEmail
        .mockReturnValueOnce("Recipient Name"); // For recipient.encryptedName

      startCronJobs();
      const scheduledFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[0][1];
      await (scheduledFunction as any)();

      expect(console.error).toHaveBeenCalledWith(
        "Failed to send email to recipient:",
        expect.any(Error)
      );
    });
  });

  describe("cleanupExpiredPasswords", () => {
    it("should clean up expired temporary passwords", async () => {
      startCronJobs();
      const cleanupFunction = (mockedCron.schedule as MockedFunction<any>).mock
        .calls[2][1];
      await (cleanupFunction as any)();

      expect(console.log).toHaveBeenCalledWith(
        "🧹 Cleaning up expired temporary passwords..."
      );
      expect(console.log).toHaveBeenCalledWith(
        "🗑️ Cleaned up expired passwords"
      );

      // Verify the database update was called
      expect(db.update).toHaveBeenCalled();
    });

    it("should handle cleanup errors", async () => {
      const cleanupError = new Error("Database cleanup failed");
      // Mock database update chain to throw error
      Object.assign(db, {
        ...createMockChain(),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockImplementation(() => {
            throw cleanupError;
          }),
        }),
      });

      startCronJobs();
      const cleanupFunction = (mockedCron.schedule as MockedFunction<any>).mock
        .calls[2][1];
      await (cleanupFunction as any)();

      expect(console.error).toHaveBeenCalledWith(
        "❌ Error cleaning up expired passwords:",
        cleanupError
      );
    });
  });

  describe("integration scenarios", () => {
    it("should handle multiple emails in a single run", async () => {
      const mockMultipleEmails = [
        {
          email: {
            id: "email1",
            title: "Email 1",
            userId: "user1",
            nostrEventId: "event1",
          },
          user: {
            id: "user1",
            email: "user1@example.com",
            nostrPrivateKey: "key1",
          },
        },
        {
          email: {
            id: "email2",
            title: "Email 2",
            userId: "user2",
            nostrEventId: "event2",
          },
          user: {
            id: "user2",
            email: "user2@example.com",
            nostrPrivateKey: "key2",
          },
        },
      ];

      const mockMultipleRecipients = [
        {
          id: "r1",
          deadmanEmailId: "email1",
          encryptedEmail: "enc1",
          encryptedName: "name1",
        },
        {
          id: "r2",
          deadmanEmailId: "email2",
          encryptedEmail: "enc2",
          encryptedName: "name2",
        },
      ];

      mockDbOperations.where
        .mockResolvedValueOnce(mockMultipleEmails)
        .mockResolvedValueOnce([mockMultipleRecipients[0]])
        .mockResolvedValueOnce([mockMultipleRecipients[1]]);

      mockedDecryptData.mockReturnValue("decrypted-value");

      mockedNostrService.getUserRelays.mockResolvedValue([]);
      mockedNostrService.retrieveEncryptedEmail.mockResolvedValue({
        subject: "Test",
        content: "Content",
      });
      mockedSendDeadmanEmail.mockResolvedValue(true);

      startCronJobs();
      const scheduledFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[0][1];
      await (scheduledFunction as any)();

      expect(console.log).toHaveBeenCalledWith(
        "📧 Found 2 scheduled emails to send"
      );
      expect(mockedSendDeadmanEmail).toHaveBeenCalledTimes(2);
    });

    it("should continue processing emails even if one fails", async () => {
      const mockEmails = [
        {
          email: { id: "email1", title: "Email 1", userId: "user1" },
          user: { id: "user1", email: "user1@example.com" },
        },
        {
          email: { id: "email2", title: "Email 2", userId: "user2" },
          user: { id: "user2", email: "user2@example.com" },
        },
      ];

      mockDbOperations.where
        .mockResolvedValueOnce(mockEmails)
        .mockResolvedValueOnce([]) // No recipients for first email
        .mockResolvedValueOnce([
          {
            id: "r2",
            deadmanEmailId: "email2",
            encryptedEmail: "enc2",
            encryptedName: "name2",
          },
        ]);

      mockedDecryptData.mockReturnValue("decrypted");
      mockedSendDeadmanEmail.mockResolvedValue(true);

      startCronJobs();
      const scheduledFunction = (mockedCron.schedule as MockedFunction<any>)
        .mock.calls[0][1];
      await (scheduledFunction as any)();

      // First email should warn about no recipients
      expect(console.warn).toHaveBeenCalledWith(
        "No recipients found for email email1"
      );

      // Second email should process normally
      expect(mockedSendDeadmanEmail).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        "🎉 Successfully processed email email2"
      );
    });
  });
});
