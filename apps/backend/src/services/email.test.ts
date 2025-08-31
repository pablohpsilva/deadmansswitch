import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  MockedFunction,
} from "vitest";
import * as nodemailer from "nodemailer";
import {
  sendTempPasswordEmail,
  sendDeadmanEmail,
  resetTransporter,
} from "./email";

// Mock nodemailer
vi.mock("nodemailer");

const mockTransporter = {
  sendMail: vi.fn(),
  verify: vi.fn(),
};

const mockedNodemailer = nodemailer as any;

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset environment variables
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.FROM_EMAIL;
    delete process.env.NODE_ENV;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_REJECT_UNAUTHORIZED;
    delete process.env.SMTP_DEBUG;
    delete process.env.AWS_REGION;

    mockedNodemailer.createTransport = vi.fn().mockReturnValue(mockTransporter);

    // Reset the transporter global variable in the email module
    resetTransporter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sendTempPasswordEmail", () => {
    it("should send email with SMTP configuration", async () => {
      // Set up SMTP environment variables
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "password123";
      process.env.FROM_EMAIL = "noreply@example.com";

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await sendTempPasswordEmail("test@example.com", "ABC123");

      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: {
          user: "user@example.com",
          pass: "password123",
        },
        tls: {
          rejectUnauthorized: true,
          minVersion: "TLSv1.2",
        },
        connectionTimeout: 30000,
        socketTimeout: 30000,
        pool: true,
        maxConnections: 5,
        maxMessages: 10,
        debug: false,
        logger: false,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: "noreply@example.com",
        to: "test@example.com",
        subject: "Your Dead Man's Switch Login Code",
        html: expect.stringContaining("ABC123"),
        text: expect.stringContaining("ABC123"),
      });
    });

    it("should use SendGrid when SENDGRID_API_KEY is provided", async () => {
      process.env.SENDGRID_API_KEY = "sg-test-key";
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await sendTempPasswordEmail("test@example.com", "XYZ789");

      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        service: "SendGrid",
        auth: {
          user: "apikey",
          pass: "sg-test-key",
        },
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: "noreply@deadmansswitch.com",
        to: "test@example.com",
        subject: "Your Dead Man's Switch Login Code",
        html: expect.stringContaining("XYZ789"),
        text: expect.stringContaining("XYZ789"),
      });
    });

    it("should use AWS SES when AWS credentials are provided", async () => {
      process.env.AWS_ACCESS_KEY_ID = "aws-key-id";
      process.env.AWS_SECRET_ACCESS_KEY = "aws-secret";
      process.env.AWS_REGION = "eu-west-1";

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await sendTempPasswordEmail("test@example.com", "DEF456");

      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        host: "email.eu-west-1.amazonaws.com",
        port: 587,
        secure: false,
        auth: {
          user: "aws-key-id",
          pass: "aws-secret",
        },
      });
    });

    it("should use test transporter when no email service is configured", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await sendTempPasswordEmail("test@example.com", "TEST123");

      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        streamTransport: true,
        newline: "unix",
        buffer: true,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "📧 EMAIL SIMULATION (No email service configured)"
      );
      expect(consoleSpy).toHaveBeenCalledWith("🔐 TEMPORARY PASSWORD: TEST123");

      consoleSpy.mockRestore();
    });

    it("should handle email sending errors", async () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "password123";

      const error = new Error("SMTP connection failed");
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        sendTempPasswordEmail("test@example.com", "ABC123")
      ).rejects.toThrow("Failed to send email");
    });

    it("should log temp password in development mode on error", async () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "password123";
      process.env.NODE_ENV = "development";

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const error = new Error("SMTP connection failed");
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        sendTempPasswordEmail("test@example.com", "ABC123")
      ).rejects.toThrow("Failed to send email");

      expect(consoleSpy).toHaveBeenCalledWith(
        "🔐 DEVELOPMENT MODE - Your temporary password is:",
        "ABC123"
      );

      consoleSpy.mockRestore();
    });

    it("should use secure connection for port 465", async () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "password123";
      process.env.SMTP_PORT = "465";

      await sendTempPasswordEmail("test@example.com", "ABC123");

      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.example.com",
        port: 465,
        secure: true,
        auth: {
          user: "user@example.com",
          pass: "password123",
        },
        tls: {
          rejectUnauthorized: true,
          minVersion: "TLSv1.2",
        },
        connectionTimeout: 30000,
        socketTimeout: 30000,
        pool: true,
        maxConnections: 5,
        maxMessages: 10,
        debug: false,
        logger: false,
      });
    });
  });

  describe("sendDeadmanEmail", () => {
    beforeEach(() => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "password123";
      process.env.FROM_EMAIL = "noreply@example.com";

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
    });

    it("should send deadman email successfully", async () => {
      const result = await sendDeadmanEmail(
        "recipient@example.com",
        "Important Message",
        "This is a test message",
        "John Doe"
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"John Doe" <noreply@example.com>',
        to: "recipient@example.com",
        subject: "[Dead Man's Switch] Important Message",
        html: expect.stringContaining("Message from John Doe"),
        text: expect.stringContaining("Message from John Doe"),
      });
    });

    it("should use default fromName when not provided", async () => {
      await sendDeadmanEmail(
        "recipient@example.com",
        "Test Subject",
        "Test content"
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"A friend" <noreply@example.com>',
        to: "recipient@example.com",
        subject: "[Dead Man's Switch] Test Subject",
        html: expect.stringContaining("Message from A friend"),
        text: expect.stringContaining("Message from A friend"),
      });
    });

    it("should handle email sending errors", async () => {
      const error = new Error("SMTP connection failed");
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        sendDeadmanEmail("test@example.com", "Subject", "Content")
      ).rejects.toThrow("Failed to send email");
    });

    it("should include subject and content in email body", async () => {
      const subject = "Urgent: Please read this";
      const content = "This is very important content\nWith multiple lines";

      await sendDeadmanEmail("test@example.com", subject, content);

      const [mailOptions] = mockTransporter.sendMail.mock.calls[0];
      expect(mailOptions.html).toContain(subject);
      expect(mailOptions.html).toContain(content);
      expect(mailOptions.text).toContain(subject);
      expect(mailOptions.text).toContain(content);
    });
  });

  describe("Transporter connection verification", () => {
    it("should verify SMTP connection on startup", async () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASSWORD = "password123";

      const mockVerify = vi.fn();
      mockTransporter.verify = mockVerify;

      // Call a function that creates the transporter
      await sendTempPasswordEmail("test@example.com", "ABC123");

      expect(mockVerify).toHaveBeenCalled();
    });
  });
});
