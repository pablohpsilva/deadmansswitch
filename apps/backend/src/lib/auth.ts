import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "@/db/connection";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const TEMP_PASSWORD_EXPIRES = 24 * 60 * 60 * 1000; // 24 hours

export interface TokenPayload {
  userId: string;
  email?: string;
  nostrPublicKey?: string;
  tier: "free" | "premium" | "lifetime";
}

export function generateTempPassword(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export async function generateNostrKeypair() {
  // Generate a new private key (32 bytes)
  const privateKey = crypto.randomBytes(32).toString("hex");

  // Use nostr-tools to generate the public key
  try {
    const nostrTools = await import("nostr-tools");
    const publicKey = nostrTools.getPublicKey
      ? nostrTools.getPublicKey(privateKey)
      : privateKey + "_pubkey";

    return {
      privateKey,
      publicKey,
    };
  } catch (error) {
    console.warn(
      "Failed to import nostr-tools, using fallback keypair generation"
    );
    return {
      privateKey,
      publicKey: privateKey + "_pubkey", // Fallback
    };
  }
}

export function encryptData(
  data: string,
  key: string = process.env.ENCRYPTION_KEY || "default-key"
): string {
  const cipher = crypto.createCipher("aes-256-cbc", key);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function decryptData(
  encryptedData: string,
  key: string = process.env.ENCRYPTION_KEY || "default-key"
): string {
  const decipher = crypto.createDecipher("aes-256-cbc", key);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
