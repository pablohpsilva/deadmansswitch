# Email Dashboard User Guide

This guide explains how to use the Dead Man's Switch email dashboard to create, manage, and monitor your dead man's switch emails.

## 🚪 Accessing the Dashboard

After logging in (either via email or Nostr), you'll be automatically redirected to your dashboard at `/dashboard`.

### Authentication Methods:

- **Email Users**: Sign up with email → Get temporary password → Access dashboard
- **Nostr Users**: Sign with your existing Nostr keys → Access dashboard

## 📊 Dashboard Overview

### Main Interface

The dashboard consists of:

- **Header**: User info, tier status, logout button
- **Sidebar**: Quick actions and usage limits
- **Main Area**: Email management interface

### User Profile

- Shows authentication method (📧 Email or 🔗 Nostr)
- Displays current tier (Free/Premium/Lifetime)
- Last check-in time
- Quick check-in button

## 📧 Managing Emails

### Creating a New Email

1. **Click "Create Email"** from sidebar or main area
2. **Fill out the form:**

   - **Title**: Internal name for your email (e.g., "Important Family Message")
   - **Subject**: What recipients will see as email subject
   - **Content**: Your message (supports line breaks)
   - **Recipients**: Add up to your tier limit (2 for free, 10 for premium)
   - **Schedule**: Choose between:
     - **Specific Date**: Send on exact date/time
     - **Check-in Interval**: Send if you don't check in for X days

3. **Click "Create Email"** to save

### Email States

- **🕐 Active**: Monitoring your check-ins, will send if conditions are met
- **⏸️ Inactive**: Paused, won't send even if conditions are met
- **✅ Sent**: Already delivered to recipients

### Viewing Emails

**Email List View:**

- See all your emails with status indicators
- Quick actions: View, Edit, Delete
- Usage summary and creation dates

**Email Detail View:**

- Full email preview showing exactly what recipients will receive
- Schedule information and countdown
- Recipient list
- Metadata (creation date, Nostr event ID, etc.)

### Editing Emails

- Click **Edit** on any unsent email
- Modify any field except for sent emails
- Can activate/deactivate emails
- Changes are encrypted and stored on Nostr relays

### Deleting Emails

- Only available for unsent emails
- Permanent action - cannot be undone
- Frees up space in your tier limits

## 📅 Scheduling Types

### Fixed Date/Time

- **Use case**: Send on specific occasion (anniversary, birthday)
- **Example**: "Send on Dec 25, 2024 at 9:00 AM"
- **Note**: Email sends regardless of your activity

### Check-in Interval

- **Use case**: Send if you're inactive for too long
- **Example**: "Send if I don't check in for 30 days"
- **Note**: Resets every time you check in

## ✅ Check-in System

### Purpose

- Proves you're alive and well
- Resets countdown timers for interval-based emails
- Updated automatically when you log in

### Manual Check-in

- Click check-in button in user profile
- Updates your "last seen" timestamp
- Resets all interval-based email countdowns

## 🎯 Tier Limits

### Free Tier

- **2 emails** maximum
- **2 recipients** per email
- **125 characters** subject limit
- **2,000 characters** content limit

### Premium Tier

- **100 emails** maximum
- **10 recipients** per email
- **300 characters** subject limit
- **10,000 characters** content limit

### Lifetime Tier

- Same as Premium
- One-time payment, no recurring fees

## 🔐 Security Features

### For Email Users

- Nostr keys generated automatically
- Keys stored encrypted on server
- Option to export keys and remove from server
- Migrate to full Nostr independence

### For Nostr Users

- Private keys never stored on server
- Full sovereignty over your keys
- Use existing Nostr identity
- Compatible with other Nostr applications

### Data Encryption

- Email content encrypted with your Nostr keys
- Stored on decentralized Nostr relays
- Only you can decrypt your emails
- Server never sees plaintext content

## 🚨 Important Notes

### Email Delivery

- Emails are sent from your configured SMTP server
- Recipients see professionally formatted messages
- Clear indication it's from Dead Man's Switch
- Includes your custom subject and content

### Data Backup

- Email content stored on multiple Nostr relays
- Metadata in local database
- Export Nostr keys for complete data portability
- Regular backups recommended

### Privacy

- Server never stores email content in plaintext
- Recipients encrypted in database
- Nostr network provides decentralized backup
- You control your data

## 💡 Best Practices

### Content Writing

- Be clear about the email's purpose
- Include context for recipients
- Consider emotional impact
- Test with preview function

### Scheduling

- Use check-in intervals for ongoing safety
- Use fixed dates for specific events
- Set reasonable intervals (not too short)
- Consider time zones for recipients

### Recipients

- Add names for personal touch
- Verify email addresses carefully
- Consider who should receive what information
- Group similar messages when possible

### Security

- Export your Nostr keys regularly
- Use strong passwords for email authentication
- Check in regularly to prevent accidental sends
- Keep recipient list private

## ❓ Troubleshooting

### Common Issues

**Can't Create New Email:**

- Check if you've reached your tier limit
- Verify all required fields are filled
- Check recipient email format

**Email Not Sending:**

- Verify SMTP configuration (server admin)
- Check email schedule settings
- Ensure email is marked as active

**Lost Access:**

- Email users can request new temporary password
- Nostr users need their private keys
- Contact support if needed

**Content Too Long:**

- Check character limits for your tier
- Edit content to fit limits
- Consider upgrading tier

### Error Messages

- **"Email limit reached"**: Upgrade tier or delete old emails
- **"Too many recipients"**: Reduce recipients or upgrade tier
- **"Invalid email address"**: Check recipient email format
- **"Authentication failed"**: Re-login or check credentials

## 🆙 Upgrading Your Plan

### When to Upgrade

- Approaching email limits
- Need more recipients per email
- Require longer content
- Want priority support

### Benefits of Premium

- 50x more emails (2 → 100)
- 5x more recipients (2 → 10)
- 2.4x longer subjects (125 → 300 chars)
- 5x longer content (2k → 10k chars)

## 📞 Support

### Self-Service

- Check this guide first
- Review error messages
- Test with simple emails
- Check tier limits

### Getting Help

- Email support for technical issues
- Include error messages and steps to reproduce
- Security issues get priority response
- Community support available

---

## 🎯 Quick Reference

### Dashboard Sections

- **📧 My Emails**: View and manage all emails
- **➕ Create Email**: Add new dead man's switch
- **🔑 Export Keys**: Download Nostr keys (email users only)
- **🕐 Check In**: Reset countdown timers

### Email Actions

- **👁️ View**: See email preview and details
- **✏️ Edit**: Modify unsent emails
- **🗑️ Delete**: Remove unsent emails permanently

### Status Indicators

- **🕐 Active**: Currently monitoring
- **⏸️ Inactive**: Paused, won't send
- **✅ Sent**: Successfully delivered

This dashboard gives you complete control over your digital legacy while maintaining the highest security standards. Your messages will be delivered exactly as intended, when intended, ensuring your important communications reach their destination even when you can't send them yourself.
