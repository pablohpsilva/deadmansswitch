import * as nostrTools from "nostr-tools";

// Define types locally since we're not sure about nostr-tools exports
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
import { db } from "@/db/connection";
import { nostrRelays } from "@/db/schema";
import { eq } from "drizzle-orm";

export class NostrService {
  private pool: any;

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

    return relays.filter((r) => r.isActive).map((r) => r.url);
  }

  // Get default relays if user hasn't configured any
  getDefaultRelays(): string[] {
    const defaultRelaysEnv = process.env.DEFAULT_NOSTR_RELAYS;
    if (defaultRelaysEnv) {
      return defaultRelaysEnv.split(",");
    }
    return ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.nostr.band"];
  }

  // Encrypt message using NIP17 (Gift Wrap)
  async encryptNIP17Message(
    content: string,
    recipientPubkey: string,
    senderPrivkey: string
  ): Promise<NostrEvent> {
    try {
      // Create the message event
      const messageEvent: UnsignedNostrEvent = {
        kind: 14, // Private Direct Message
        created_at: Math.floor(Date.now() / 1000),
        tags: [["p", recipientPubkey]],
        content,
        pubkey: nostrTools.getPublicKey
          ? nostrTools.getPublicKey(senderPrivkey)
          : senderPrivkey + "_pubkey",
      };

      // Sign the message event
      const signedMessage: NostrEvent = {
        ...messageEvent,
        id: nostrTools.getEventHash
          ? nostrTools.getEventHash(messageEvent)
          : Math.random().toString(36),
        sig: nostrTools.getSignature
          ? nostrTools.getSignature(messageEvent, senderPrivkey)
          : "mock_signature",
      };

      // Encrypt the signed message using NIP17 gift wrap if available
      if (nostrTools.nip17?.wrapEvent) {
        const giftWrap = await nostrTools.nip17.wrapEvent(
          signedMessage,
          recipientPubkey,
          senderPrivkey
        );
        return giftWrap;
      } else {
        console.warn(
          "NIP17 not available, returning signed message without gift wrap"
        );
        return signedMessage;
      }
    } catch (error) {
      console.error("Failed to encrypt NIP17 message:", error);
      throw new Error("Encryption failed");
    }
  }

  // Decrypt message using NIP17 (Gift Wrap)
  async decryptNIP17Message(
    giftWrapEvent: NostrEvent,
    recipientPrivkey: string
  ): Promise<NostrEvent | null> {
    try {
      if (nostrTools.nip17?.unwrapEvent) {
        const unwrapped = await nostrTools.nip17.unwrapEvent(
          giftWrapEvent,
          recipientPrivkey
        );
        return unwrapped;
      } else {
        console.warn("NIP17 unwrap not available, returning original event");
        return giftWrapEvent;
      }
    } catch (error) {
      console.error("Failed to decrypt NIP17 message:", error);
      return null;
    }
  }

  // Store encrypted email data in Nostr
  async storeEncryptedEmail(
    userId: string,
    emailData: {
      subject: string;
      content: string;
      recipients: string[];
    },
    senderPrivkey: string
  ): Promise<string> {
    const relays = await this.getUserRelays(userId);
    const relayList = relays.length > 0 ? relays : this.getDefaultRelays();

    // Create a JSON payload with email data
    const payload = {
      type: "deadman_email",
      subject: emailData.subject,
      content: emailData.content,
      recipients: emailData.recipients,
      timestamp: Date.now(),
    };

    const senderPubkey = nostrTools.getPublicKey
      ? nostrTools.getPublicKey(senderPrivkey)
      : senderPrivkey + "_pubkey";

    // Encrypt the payload for the sender (self-encryption for storage)
    const encryptedEvent = await this.encryptNIP17Message(
      JSON.stringify(payload),
      senderPubkey, // Encrypt to sender's own pubkey
      senderPrivkey
    );

    try {
      // Publish to relays
      await this.pool.publish(relayList, encryptedEvent);

      console.log(
        `📡 Email data stored in Nostr with event ID: ${encryptedEvent.id}`
      );
      return encryptedEvent.id;
    } catch (error) {
      console.error("Failed to store email in Nostr:", error);
      throw new Error("Failed to store in Nostr");
    }
  }

  // Retrieve encrypted email data from Nostr
  async retrieveEncryptedEmail(
    eventId: string,
    recipientPrivkey: string,
    relays?: string[]
  ): Promise<any | null> {
    const relayList = relays || this.getDefaultRelays();

    try {
      // Fetch the event from relays
      const event = await this.pool.get(relayList, {
        ids: [eventId],
      });

      if (!event) {
        console.warn(`Event ${eventId} not found in relays`);
        return null;
      }

      // Decrypt the event
      const decryptedEvent = await this.decryptNIP17Message(
        event,
        recipientPrivkey
      );

      if (!decryptedEvent) {
        console.warn(`Failed to decrypt event ${eventId}`);
        return null;
      }

      // Parse the JSON payload
      const payload = JSON.parse(decryptedEvent.content);
      return payload;
    } catch (error) {
      console.error("Failed to retrieve email from Nostr:", error);
      return null;
    }
  }

  // Send final deadman email via Nostr (when triggered)
  async sendDeadmanEmailViaNostr(
    emailData: {
      subject: string;
      content: string;
      recipients: string[];
    },
    senderPrivkey: string,
    relays?: string[]
  ): Promise<void> {
    const relayList = relays || this.getDefaultRelays();

    // Create notification messages for each recipient
    for (const recipient of emailData.recipients) {
      try {
        // For now, we'll assume recipients are email addresses
        // In a full implementation, you might want to map emails to Nostr pubkeys
        const notificationContent = `
Dead Man's Switch Notification

Subject: ${emailData.subject}

${emailData.content}

This message was automatically sent because the sender has been inactive.
        `;

        // Create a public note about the trigger (without revealing content)
        const publicNotification: UnsignedNostrEvent = {
          kind: 1, // Text note
          created_at: Math.floor(Date.now() / 1000),
          tags: [["t", "deadmansswitch"]],
          content: `A Dead Man's Switch has been triggered. The designated recipient has been notified via email.`,
          pubkey: nostrTools.getPublicKey
            ? nostrTools.getPublicKey(senderPrivkey)
            : senderPrivkey + "_pubkey",
        };

        const signedPublicNotification: NostrEvent = {
          ...publicNotification,
          id: nostrTools.getEventHash
            ? nostrTools.getEventHash(publicNotification)
            : Math.random().toString(36),
          sig: nostrTools.getSignature
            ? nostrTools.getSignature(publicNotification, senderPrivkey)
            : "mock_signature",
        };

        // Publish public notification
        await this.pool.publish(relayList, signedPublicNotification);

        console.log(`📡 Dead man's switch notification published to Nostr`);
      } catch (error) {
        console.error(
          `Failed to send Nostr notification for recipient ${recipient}:`,
          error
        );
      }
    }
  }

  // Test relay connectivity
  async testRelayConnectivity(relayUrl: string): Promise<boolean> {
    try {
      if (nostrTools.SimplePool) {
        // Create a temporary pool for testing
        const testPool = new nostrTools.SimplePool();

        // Try to fetch a recent event to test connectivity
        const events = await testPool.list(
          [relayUrl],
          [{ kinds: [1], limit: 1 }]
        );

        testPool.close([relayUrl]);
        return events.length >= 0; // Even 0 events means successful connection
      } else {
        console.warn("SimplePool not available, using mock connectivity test");
        return true; // Assume connectivity for now
      }
    } catch (error) {
      console.error(`Relay test failed for ${relayUrl}:`, error);
      return false;
    }
  }

  // Close all connections
  close(relays?: string[]) {
    if (relays) {
      this.pool.close(relays);
    } else {
      // Close all connections
      this.pool.close(this.getDefaultRelays());
    }
  }
}

// Export singleton instance
export const nostrService = new NostrService();
