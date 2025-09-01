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

export async function sendDeadmanEmail(
  to: string,
  subject: string,
  content: string,
  fromName: string = "A friend"
) {
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
