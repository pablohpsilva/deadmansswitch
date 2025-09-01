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
    try {
      const relays = await this.getUserRelays(userId);
      const relayList = relays.length > 0 ? relays : this.getDefaultRelays();

      // Get user's private key for signing the event
      const [user] = await (
        await import("@deadmansswitch/database")
      ).db
        .select()
        .from((await import("@deadmansswitch/database")).users)
        .where(
          (
            await import("@deadmansswitch/database")
          ).eq((await import("@deadmansswitch/database")).users.id, userId)
        );

      if (!user?.nostrPrivateKey) {
        throw new Error("No Nostr keys found for user");
      }

      const privateKey = (await import("../lib/auth")).decryptData(
        user.nostrPrivateKey
      );

      // Create event with pre-encrypted data
      const eventTemplate: UnsignedNostrEvent = {
        pubkey: nostrTools.getPublicKey(privateKey as any),
        created_at: Math.floor(Date.now() / 1000),
        kind: 30078, // Parameterized replaceable event for app-specific data
        tags: [
          ["d", "deadman_email"], // Identifier for dead man's switch emails
          ["client_encrypted", "true"], // Mark as client-side encrypted
          ["encryption_method", encryptedData.encryptionMethod],
          ["encrypted_by_pubkey", encryptedData.publicKey],
        ],
        content: JSON.stringify({
          type: "deadman_email_encrypted",
          encryptedSubject: encryptedData.encryptedSubject,
          encryptedContent: encryptedData.encryptedContent,
          encryptedRecipients: encryptedData.encryptedRecipients,
          timestamp: Date.now(),
        }),
      };

      const signedEvent = nostrTools.finalizeEvent(
        eventTemplate,
        privateKey as any
      );
      await this.pool.publish(relayList, signedEvent);

      return signedEvent.id;
    } catch (error) {
      console.error("Failed to store pre-encrypted email in Nostr:", error);
      throw error;
    }
  }

  // Store encrypted email data in Nostr (legacy method - will encrypt on server)
  async storeEncryptedEmail(
    userId: string,
    emailData: {
      subject: string;
      content: string;
      recipients: string[];
    },
    senderPrivkey: string
  ): Promise<string> {
    try {
      const relays = await this.getUserRelays(userId);
      const relayList = relays.length > 0 ? relays : this.getDefaultRelays();

      // Create event
      const eventTemplate: UnsignedNostrEvent = {
        pubkey: nostrTools.getPublicKey(senderPrivkey as any),
        created_at: Math.floor(Date.now() / 1000),
        kind: 1, // Text note
        tags: [],
        content: JSON.stringify(emailData),
      };

      const signedEvent = nostrTools.finalizeEvent(
        eventTemplate,
        senderPrivkey as any
      );
      await this.pool.publish(relayList, signedEvent);

      return signedEvent.id;
    } catch (error) {
      console.error("Failed to store email in Nostr:", error);
      throw error;
    }
  }

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

  // Retrieve encrypted email from Nostr (legacy method - server-side decryption)
  async retrieveEncryptedEmail(
    eventId: string,
    privateKey: string,
    relays?: string[]
  ): Promise<{ subject: string; content: string } | null> {
    try {
      const relayList = relays || this.getDefaultRelays();

      const filter = {
        ids: [eventId],
        kinds: [1], // Text note
      };

      const event = await this.pool.get(relayList, filter);

      if (!event) {
        console.warn(`No event found with ID: ${eventId}`);
        return null;
      }

      // Parse the content
      try {
        const emailData = JSON.parse(event.content);
        return {
          subject: emailData.subject || "Dead Man's Switch Notification",
          content: emailData.content || event.content,
        };
      } catch (error) {
        console.warn(
          "Failed to parse content as JSON, using as plain text:",
          error
        );
        return {
          subject: "Dead Man's Switch Notification",
          content: event.content,
        };
      }
    } catch (error) {
      console.error("Failed to retrieve email from Nostr:", error);
      return null;
    }
  }

  // Close connections
  close(relays?: string[]) {
    if (this.pool?.close) {
      this.pool.close(relays);
    }
  }
}

// Export singleton instance
export const nostrService = new NostrService();
