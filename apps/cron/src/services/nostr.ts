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

  // Retrieve encrypted email from Nostr
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

      // Try to decrypt the content
      try {
        const decryptedContent = await this.decryptNIP17Message(
          event,
          privateKey
        );
        if (decryptedContent) {
          // Parse the decrypted content as JSON
          const emailData = JSON.parse(decryptedContent.content);
          return {
            subject: emailData.subject || "Dead Man's Switch Notification",
            content: emailData.content || event.content,
          };
        }
      } catch (error) {
        console.warn("Failed to decrypt content, using as plain text:", error);
      }

      // Fallback to plain text
      return {
        subject: "Dead Man's Switch Notification",
        content: event.content,
      };
    } catch (error) {
      console.error("Failed to retrieve email from Nostr:", error);
      return null;
    }
  }

  // Decrypt message using NIP17 (Gift Wrap)
  async decryptNIP17Message(
    giftWrapEvent: NostrEvent,
    recipientPrivkey: string
  ): Promise<NostrEvent | null> {
    try {
      if (nostrTools.nip17?.unwrapEvent) {
        const recipientKey =
          typeof recipientPrivkey === "string"
            ? hexToBytes(recipientPrivkey)
            : recipientPrivkey;

        const unwrapped = await nostrTools.nip17.unwrapEvent(
          giftWrapEvent,
          recipientKey as any // Type varies between nostr-tools versions
        );
        return unwrapped as NostrEvent;
      } else {
        console.warn("NIP17 unwrap not available, returning original event");
        return giftWrapEvent;
      }
    } catch (error) {
      console.error("Failed to decrypt NIP17 message:", error);
      return null;
    }
  }

  // Send notification via Nostr
  async sendDeadmanEmailViaNostr(
    emailData: {
      subject: string;
      content: string;
      recipients: string[];
    },
    privateKey: string,
    relays?: string[]
  ): Promise<void> {
    try {
      const relayList = relays || this.getDefaultRelays();

      // Create notification event
      const eventTemplate: UnsignedNostrEvent = {
        pubkey: nostrTools.getPublicKey(privateKey as any),
        created_at: Math.floor(Date.now() / 1000),
        kind: 1, // Text note
        tags: [],
        content: JSON.stringify({
          type: "deadman_email_sent",
          subject: emailData.subject,
          recipients: emailData.recipients.length,
          timestamp: new Date().toISOString(),
        }),
      };

      const signedEvent = nostrTools.finalizeEvent(
        eventTemplate,
        privateKey as any
      );
      await this.pool.publish(relayList, signedEvent);

      console.log("Deadman email notification sent via Nostr");
    } catch (error) {
      console.error("Failed to send Nostr notification:", error);
      throw error;
    }
  }

  // Get default relays
  private getDefaultRelays(): string[] {
    const defaultRelays = process.env.DEFAULT_NOSTR_RELAYS?.split(",") || [
      "wss://relay.damus.io",
      "wss://nostr.wine",
      "wss://relay.nostr.info",
    ];
    return defaultRelays;
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
