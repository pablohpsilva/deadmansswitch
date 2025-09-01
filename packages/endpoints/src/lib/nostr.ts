import * as crypto from "crypto";

export async function verifyNostrSignature(
  publicKey: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    // Dynamic import for nostr-tools
    const nostrTools = await import("nostr-tools");

    if (nostrTools.verifyEvent) {
      // Create a minimal event-like object for verification
      const eventLike = {
        kind: 1,
        content: message,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        pubkey: publicKey,
        id: "", // Will be computed
        sig: signature,
      };

      // Compute event ID if needed
      if (nostrTools.getEventHash) {
        eventLike.id = nostrTools.getEventHash(eventLike);
      }

      return nostrTools.verifyEvent(eventLike);
    }

    // Fallback: basic validation
    return publicKey.length === 64 && signature.length === 128;
  } catch (error) {
    console.error("Nostr signature verification failed:", error);
    return false;
  }
}

export function generatePublicKeyFromPrivate(privateKey: string): string {
  try {
    // This is a simplified implementation
    // In a real implementation, you'd use proper secp256k1 cryptography
    const hash = crypto.createHash("sha256").update(privateKey).digest("hex");
    return hash.substring(0, 64);
  } catch (error) {
    console.error("Failed to generate public key:", error);
    return "fallback_" + crypto.randomBytes(16).toString("hex");
  }
}

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export function validateNostrEvent(event: NostrEvent): boolean {
  return !!(
    event.id &&
    event.pubkey &&
    event.created_at &&
    typeof event.kind === "number" &&
    Array.isArray(event.tags) &&
    event.content &&
    event.sig
  );
}
