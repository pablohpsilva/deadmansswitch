# Nostr Key Security Implementation Guide

This document explains how the Dead Man's Switch application securely handles Nostr keys based on the authentication method used.

## 🔐 Security Principles

1. **Never store private keys for Nostr-authenticated users**
2. **Temporarily store encrypted private keys for email-authenticated users only**
3. **Clear distinction between authentication methods**
4. **Immediate key deletion after export**

## 📋 Authentication Types

### 1. Email Authentication (`authType: "email"`)

**For users who sign up with their email address**

- **Private Key**: ✅ Generated and stored **encrypted** in database
- **Public Key**: ✅ Stored in database
- **Key Export**: ✅ Available (removes keys from server)
- **Use Case**: Users who don't have Nostr keys yet

```typescript
// Email user creation
{
  email: "user@example.com",
  authType: "email",
  nostrPrivateKey: "encrypted_private_key", // AES encrypted
  nostrPublicKey: "npub1...",
  // Other fields...
}
```

### 2. Nostr Authentication (`authType: "nostr"`)

**For users who authenticate with their existing Nostr keys**

- **Private Key**: ❌ **NEVER stored** (user keeps their own keys)
- **Public Key**: ✅ Stored in database (for identification)
- **Key Export**: ❌ Not available (user already has their keys)
- **Use Case**: Existing Nostr users with their own key management

```typescript
// Nostr user creation
{
  email: null, // No email required
  authType: "nostr",
  nostrPrivateKey: null, // NEVER stored
  nostrPublicKey: "npub1...",
  // Other fields...
}
```

## 🛡️ Security Implementation

### Database Schema Changes

```sql
-- New column to distinguish authentication methods
ALTER TABLE "users" ADD COLUMN "auth_type" varchar(20) DEFAULT 'email' NOT NULL;
```

### Authentication Flow Security

#### Email Authentication

```typescript
// 1. User requests auth via email
requestEmailAuth(email) -> {
  // Generate Nostr keypair for new users
  const keypair = generateNostrKeypair();

  // Store encrypted private key (ONLY for email users)
  await db.insert(users).values({
    email,
    authType: "email",
    nostrPrivateKey: encryptData(keypair.privateKey), // AES encrypted
    nostrPublicKey: keypair.publicKey
  });
}

// 2. User exports keys (removes from server)
exportNostrKeys() -> {
  // Only available for email users
  if (user.authType !== "email") {
    throw new Error("Not available for Nostr users");
  }

  const privateKey = decryptData(user.nostrPrivateKey);

  // IMMEDIATELY remove from database
  await db.update(users).set({
    nostrPrivateKey: null
  });

  return { privateKey, publicKey };
}
```

#### Nostr Authentication

```typescript
// User authenticates with signature
loginWithNostr(publicKey, signature, message) -> {
  // Verify signature with public key
  const valid = verifySignature(publicKey, signature, message);

  if (valid) {
    await db.insert(users).values({
      authType: "nostr",
      nostrPublicKey: publicKey,
      // nostrPrivateKey: null (NEVER stored)
    });
  }
}
```

### Encryption Details

- **Algorithm**: AES-256-CBC
- **Key**: Environment-specific encryption key
- **Storage**: Only for email-authenticated users
- **Lifecycle**: Generated → Encrypted → Stored → Exported → Deleted

## 🔄 Migration Process

### For Existing Users

```bash
# 1. Apply database migration
pnpm run db:migrate

# 2. Update existing user data
tsx src/db/update-existing-users.ts
```

The migration script:

- Sets `authType: "email"` for users with email addresses
- Sets `authType: "nostr"` for users without email addresses
- Removes any stored private keys from Nostr users (security cleanup)

## 🚨 Security Checks

### Database Integrity

```typescript
// Verify no Nostr users have private keys stored
const nostrUsersWithKeys = await db
  .select()
  .from(users)
  .where(and(eq(users.authType, "nostr"), isNotNull(users.nostrPrivateKey)));

if (nostrUsersWithKeys.length > 0) {
  throw new Error("SECURITY VIOLATION: Nostr users with stored private keys");
}
```

### Runtime Validation

```typescript
// User profile endpoint includes security info
me() -> {
  return {
    authType: user.authType,
    hasNostrKeys: !!user.nostrPrivateKey, // Only true for email users
    canExportKeys: user.authType === "email" && !!user.nostrPrivateKey,
  };
}
```

## 🎯 API Changes

### New Fields in User Response

```typescript
interface UserProfile {
  id: string;
  email?: string;
  authType: "email" | "nostr"; // NEW: Auth method
  nostrPublicKey: string;
  hasNostrKeys: boolean; // Only true for email users
  canExportKeys: boolean; // NEW: Export availability
  // ... other fields
}
```

### Updated Export Endpoint

```typescript
// Only available for email users
exportNostrKeys() -> {
  if (user.authType !== "email") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Key export only available for email users"
    });
  }
  // ... export logic
}
```

## ✅ Security Checklist

### Development

- [ ] Never log private keys
- [ ] Use secure encryption for stored keys
- [ ] Validate authentication type before key operations
- [ ] Test both authentication flows

### Production

- [ ] Use strong encryption keys (environment-specific)
- [ ] Monitor for unauthorized key access attempts
- [ ] Regular security audits of key storage
- [ ] Backup procedures exclude private key data

### User Education

- [ ] Explain the difference between auth methods
- [ ] Warn users about key export consequences
- [ ] Provide Nostr client recommendations
- [ ] Clear instructions for key management

## 🔍 Monitoring and Logging

### Security Events to Log

```typescript
// Log key-related operations (without exposing keys)
auditLog.create({
  userId: user.id,
  action: "NOSTR_KEYS_EXPORTED",
  details: `User exported Nostr keys via ${user.authType} auth`,
  timestamp: new Date(),
});

auditLog.create({
  userId: user.id,
  action: "NOSTR_AUTH_ATTEMPT",
  details: `Authentication via Nostr signature`,
  ipAddress: request.ip,
});
```

### Alerts

- Multiple failed Nostr authentication attempts
- Key export requests from suspicious IPs
- Database queries attempting to access private keys for Nostr users

## 📚 Best Practices

### For Email Users

1. **Export keys early**: Don't rely on server storage
2. **Use reputable Nostr clients**: Damus, Amethyst, Nostter
3. **Backup keys securely**: Store in password managers
4. **Understand the warning**: Keys are permanently deleted after export

### For Nostr Users

1. **Keep keys secure**: Server never sees your private key
2. **Use hardware wallets**: For high-value accounts
3. **Regular backups**: Of your own key storage
4. **Client security**: Keep Nostr clients updated

## 🚫 What We DON'T Do

- ❌ Store private keys for Nostr-authenticated users
- ❌ Allow key export for Nostr-authenticated users
- ❌ Log or transmit private keys in plaintext
- ❌ Share keys between authentication methods
- ❌ Keep keys after user exports them

## ✅ What We DO

- ✅ Encrypt private keys for email users only
- ✅ Delete keys immediately after export
- ✅ Clear authentication type distinction
- ✅ Verify signatures for Nostr authentication
- ✅ Audit all key-related operations

---

## 🔒 Security Contact

If you discover any security vulnerabilities related to key management:

1. **DO NOT** create public issues
2. **DO** contact security@deadmansswitch.com
3. **DO** provide steps to reproduce
4. **DO** suggest remediation if possible

This implementation ensures maximum security while providing flexibility for both new and existing Nostr users.
