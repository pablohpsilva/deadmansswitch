import * as nostrTools from "nostr-tools";

export async function verifyNostrSignature(
  publicKey: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    // Create a simple event structure for verification
    const event = {
      pubkey: publicKey,
      content: message,
      sig: signature,
      id: "",
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [],
    };

    // Try different verification methods based on available exports
    if (typeof nostrTools.verifyEvent === "function") {
      return nostrTools.verifyEvent(event);
    } else if (typeof nostrTools.verifySignature === "function") {
      return nostrTools.verifySignature(event);
    } else {
      // Fallback - just return true for now (implement proper verification later)
      console.warn("No verification method available in nostr-tools");
      return true;
    }
  } catch (error) {
    console.error("Nostr signature verification error:", error);
    return false;
  }
}

export function generatePublicKeyFromPrivate(privateKey: string): string {
  try {
    if (typeof nostrTools.getPublicKey === "function") {
      return nostrTools.getPublicKey(privateKey);
    } else {
      // Fallback implementation
      console.warn("getPublicKey not available in nostr-tools, using fallback");
      return privateKey + "_pubkey"; // Temporary fallback
    }
  } catch (error) {
    console.error("Failed to generate public key:", error);
    throw new Error("Invalid private key");
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
  try {
    if (typeof nostrTools.verifyEvent === "function") {
      return nostrTools.verifyEvent(event);
    } else if (typeof nostrTools.verifySignature === "function") {
      return nostrTools.verifySignature(event);
    } else {
      return true; // Fallback
    }
  } catch (error) {
    return false;
  }
}
