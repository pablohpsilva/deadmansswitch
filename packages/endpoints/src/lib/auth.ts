import * as crypto from "crypto";
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "your-secret-key-here";
}

export interface TokenPayload {
  userId: string;
  email?: string;
  nostrPublicKey?: string;
  tier: "free" | "premium" | "lifetime";
}

export function generateTempPassword(): string {
  return crypto.randomBytes(8).toString("hex");
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

// DEPRECATED: generateNostrKeypair
// Nostr keys should NEVER be generated on the server for security reasons.
// All key generation must happen client-side to ensure private keys never leave the user's device.
export async function generateNostrKeypair() {
  throw new Error(
    "Server-side Nostr key generation is deprecated for security reasons. " +
      "Keys must be generated client-side using nostr-tools in the browser."
  );
}

export function encryptData(
  data: string,
  key: string = process.env.ENCRYPTION_KEY || "default-key"
): string {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);

  // Create a 32-byte key from the provided key
  const keyBuffer = crypto.createHash("sha256").update(key).digest();

  const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Prepend IV to the encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptData(
  encryptedData: string,
  key: string = process.env.ENCRYPTION_KEY || "default-key"
): string {
  const parts = encryptedData.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  // Create a 32-byte key from the provided key
  const keyBuffer = crypto.createHash("sha256").update(key).digest();

  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
