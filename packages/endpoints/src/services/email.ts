import nodemailer from "nodemailer";

// Create reusable transporter object using the SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendTempPasswordEmail(
  email: string,
  tempPassword: string
) {
  const mailOptions = {
    from: process.env.FROM_EMAIL || "noreply@deadmansswitch.com",
    to: email,
    subject: "Your temporary password for Dead Man's Switch",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Your Temporary Password</h2>
        <p>You requested access to your Dead Man's Switch account. Here's your temporary password:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <code style="font-size: 18px; font-weight: bold;">${tempPassword}</code>
        </div>
        <p>This password will expire in 24 hours for security reasons.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    text: `
Your temporary password for Dead Man's Switch: ${tempPassword}

This password will expire in 24 hours for security reasons.
If you didn't request this, please ignore this email.
`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Temp password email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send temp password email:", error);
    throw new Error("Failed to send email");
  }
}
