import * as crypto from "crypto";

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
