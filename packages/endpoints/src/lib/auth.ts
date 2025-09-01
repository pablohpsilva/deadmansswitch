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

export async function generateNostrKeypair() {
  try {
    // Dynamic import for nostr-tools since it might not be available in all environments
    const nostrTools = await import("nostr-tools");

    if (nostrTools.generateSecretKey && nostrTools.getPublicKey) {
      // Use new API (v2.x)
      const privateKey = nostrTools.generateSecretKey();
      const publicKey = nostrTools.getPublicKey(privateKey);

      return {
        privateKey: Buffer.from(privateKey).toString("hex"),
        publicKey,
      };
    } else {
      // Fallback using crypto
      const privateKeyBytes = crypto.randomBytes(32);
      return {
        privateKey: privateKeyBytes.toString("hex"),
        publicKey: "fallback_" + crypto.randomBytes(16).toString("hex"),
      };
    }
  } catch (error) {
    console.error("Failed to generate Nostr keypair:", error);
    // Fallback
    const privateKeyBytes = crypto.randomBytes(32);
    return {
      privateKey: privateKeyBytes.toString("hex"),
      publicKey: "fallback_" + crypto.randomBytes(16).toString("hex"),
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
