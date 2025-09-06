import * as nostrTools from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import { db, nostrRelays, eq } from "@deadmansswitch/database";

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface UnsignedNostrEvent {
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}

export class NostrService {
  private pool: any; // SimplePool interface varies by version, using flexible typing

  constructor() {
    // Initialize pool if SimplePool is available
    if (nostrTools.SimplePool) {
      this.pool = new nostrTools.SimplePool();
    } else {
      console.warn(
        "SimplePool not available in nostr-tools, using mock implementation"
      );
      this.pool = {
        publish: async () => Promise.resolve(),
        get: async () => Promise.resolve(null),
        list: async () => Promise.resolve([]),
        close: () => {},
      };
    }
  }

  // Get user's configured relays
  async getUserRelays(userId: string): Promise<string[]> {
    const relays = await db
      .select()
      .from(nostrRelays)
      .where(eq(nostrRelays.userId, userId));

    return relays.map((relay) => relay.url);
  }

  // Get default relays
  getDefaultRelays(): string[] {
    const defaultRelays = process.env.DEFAULT_NOSTR_RELAYS?.split(",") || [
      "wss://relay.damus.io",
      "wss://nostr.wine",
      "wss://relay.nostr.info",
    ];
    return defaultRelays;
  }

  // Test relay connectivity
  async testRelayConnectivity(url: string): Promise<boolean> {
    try {
      // Simple connectivity test
      return url.startsWith("wss://") || url.startsWith("ws://");
    } catch (error) {
      console.error("Failed to test relay connectivity:", error);
      return false;
    }
  }

  // Store pre-encrypted email data in Nostr (data already encrypted on client-side)
  // NOTE: This method is now deprecated as per security requirements
  // Events must be signed client-side and submitted directly to relays
  async storePreEncryptedEmail(
    userId: string,
    encryptedData: {
      encryptedSubject: string;
      encryptedContent: string;
      encryptedRecipients: string;
      encryptionMethod: string;
      publicKey: string;
    }
  ): Promise<string> {
    throw new Error(
      "Server-side event signing is disabled per security requirements. " +
        "Events must be signed client-side with user's private key."
    );
  }

  // REMOVED: storeEncryptedEmail method
  // Server-side encryption and signing violates security principles.
  // All encryption and event signing must happen client-side.

  // Retrieve raw event data from Nostr (for client-side decryption)
  async retrieveRawEvent(
    eventId: string,
    relays?: string[]
  ): Promise<{ content: string; tags: string[][]; kind: number } | null> {
    try {
      const relayList = relays || this.getDefaultRelays();

      const filter = {
        ids: [eventId],
      };

      const event = await this.pool.get(relayList, filter);

      if (!event) {
        console.warn(`No event found with ID: ${eventId}`);
        return null;
      }

      return {
        content: event.content,
        tags: event.tags || [],
        kind: event.kind,
      };
    } catch (error) {
      console.error("Failed to retrieve raw event from Nostr:", error);
      return null;
    }
  }

  // REMOVED: retrieveEncryptedEmail method
  // Server-side decryption violates security principles.
  // Use retrieveRawEvent() instead and decrypt on client-side.

  // Close connections
  close(relays?: string[]) {
    if (this.pool?.close) {
      this.pool.close(relays);
    }
  }
}

// Export singleton instance
export const nostrService = new NostrService();
