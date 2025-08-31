import * as nodemailer from "nodemailer";

// Email transporter setup
let transporter: nodemailer.Transporter;

// Test helper function to reset transporter
export function resetTransporter() {
  transporter = null as any;
}

function getEmailTransporter() {
  if (!transporter) {
    // Priority order: Self-hosted SMTP > Third-party services > Test mode

    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    ) {
      console.log("📧 Using self-hosted SMTP server for email service");

      // Self-hosted SMTP configuration with comprehensive options
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === "true" || port === 465;

      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: secure, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        // Additional security and reliability options
        tls: {
          // Don't fail on invalid certs for self-hosted servers
          rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
          // Minimum TLS version
          minVersion: "TLSv1.2",
        },
        // Connection timeout (30 seconds)
        connectionTimeout: 30000,
        // Socket timeout (30 seconds)
        socketTimeout: 30000,
        // Max connections
        pool: true,
        maxConnections: 5,
        maxMessages: 10,
        // Enable SMTP debugging if requested
        debug: process.env.SMTP_DEBUG === "true",
        logger: process.env.SMTP_DEBUG === "true",
      });

      // Test the connection on startup
      transporter.verify((error, success) => {
        if (error) {
          console.error("❌ SMTP connection failed:", error.message);
          console.log(
            "💡 Check your SMTP configuration in environment variables"
          );
        } else {
          console.log("✅ SMTP server connection established successfully");
        }
      });
    } else if (process.env.SENDGRID_API_KEY) {
      console.log("📧 Using SendGrid for email service (third-party)");
      // SendGrid configuration
      transporter = nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: "apikey",
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
    ) {
      console.log("📧 Using AWS SES for email service (third-party)");
      // AWS SES configuration
      transporter = nodemailer.createTransport({
        host: `email.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: process.env.AWS_ACCESS_KEY_ID,
          pass: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    } else {
      console.warn(
        "⚠️ No email service configured! Emails will be logged to console instead."
      );
      console.log(
        "💡 Configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD for self-hosted email"
      );
      // Create a "test" transporter that doesn't actually send emails
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: "unix",
        buffer: true,
      });
    }
  }
  return transporter;
}

export async function sendTempPasswordEmail(
  email: string,
  tempPassword: string
) {
  const transporter = getEmailTransporter();

  const mailOptions = {
    from: process.env.FROM_EMAIL || "noreply@deadmansswitch.com",
    to: email,
    subject: "Your Dead Man's Switch Login Code",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #333; margin-bottom: 20px;">🔐 Your Login Code</h1>
          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
            Use this temporary password to access your Dead Man's Switch account:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e9ecef; margin: 20px 0;">
            <code style="font-size: 24px; font-weight: bold; color: #495057; letter-spacing: 2px;">
              ${tempPassword}
            </code>
          </div>
          
          <p style="color: #dc3545; font-size: 14px; margin-top: 20px;">
            ⚠️ This code expires in 24 hours and can only be used once.
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Dead Man's Switch - Secure, Decentralized, Trustworthy</p>
        </div>
      </div>
    `,
    text: `
Your Dead Man's Switch Login Code

Use this temporary password to access your account: ${tempPassword}

This code expires in 24 hours and can only be used once.

If you didn't request this code, please ignore this email.

Dead Man's Switch - Secure, Decentralized, Trustworthy
    `,
  };

  try {
    // Check if we're using the test transporter (no email service configured)
    if (
      !process.env.SMTP_HOST &&
      !process.env.SENDGRID_API_KEY &&
      !process.env.AWS_ACCESS_KEY_ID
    ) {
      console.log("📧 EMAIL SIMULATION (No email service configured)");
      console.log("=".repeat(60));
      console.log(`To: ${email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log("Content:");
      console.log(`🔐 TEMPORARY PASSWORD: ${tempPassword}`);
      console.log(`⚠️ This code expires in 24 hours`);
      console.log("=".repeat(60));
      console.log("💡 Configure email service in .env to send real emails");
      return;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Temporary password sent to ${email}`);
  } catch (error) {
    console.error("❌ Failed to send temporary password email:", error);

    // In development, still log the password so user can proceed
    if (process.env.NODE_ENV === "development") {
      console.log(
        "🔐 DEVELOPMENT MODE - Your temporary password is:",
        tempPassword
      );
    }

    throw new Error("Failed to send email");
  }
}

export async function sendDeadmanEmail(
  to: string,
  subject: string,
  content: string,
  fromName: string = "A friend"
) {
  const transporter = getEmailTransporter();

  const mailOptions = {
    from: `"${fromName}" <${
      process.env.FROM_EMAIL || "noreply@deadmansswitch.com"
    }>`,
    to,
    subject: `[Dead Man's Switch] ${subject}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border-left: 4px solid #ffc107;">
          <h2 style="color: #856404; margin-top: 0;">📨 Message from ${fromName}</h2>
          <p style="color: #856404; font-size: 14px;">
            This message was automatically sent by Dead Man's Switch because the sender has been inactive.
          </p>
        </div>
        
        <div style="background: white; padding: 30px; margin-top: 20px; border-radius: 10px; border: 1px solid #e9ecef;">
          <h3 style="color: #333; margin-bottom: 20px;">${subject}</h3>
          <div style="color: #495057; line-height: 1.6; white-space: pre-wrap;">
            ${content}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>This message was sent via Dead Man's Switch</p>
          <p>A secure, decentralized service for sending messages when you can't.</p>
        </div>
      </div>
    `,
    text: `
[Dead Man's Switch] Message from ${fromName}

This message was automatically sent because the sender has been inactive.

Subject: ${subject}

${content}

---
This message was sent via Dead Man's Switch
A secure, decentralized service for sending messages when you can't.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Dead man email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send dead man email:", error);
    throw new Error("Failed to send email");
  }
}
