import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  MockedFunction,
  type MockInstance,
} from "vitest";
import {
  NostrService,
  nostrService,
  NostrEvent,
  UnsignedNostrEvent,
} from "./nostr";
import { db, nostrRelays } from "@deadmansswitch/database";
import * as nostrTools from "nostr-tools";

// Mock dependencies
vi.mock("@deadmansswitch/database");
vi.mock("nostr-tools");

const mockDbChain = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn(),
};

const mockDb = mockDbChain;

const mockPool = {
  publish: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
  subscribeMany: vi.fn(),
  close: vi.fn(),
};

describe("NostrService", () => {
  let service: NostrService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock database - setup the chain properly
    mockDbChain.select.mockReturnThis();
    mockDbChain.from.mockReturnThis();
    mockDbChain.where.mockResolvedValue([]);

    // Mock the db object as a whole
    Object.assign(db, {
      select: mockDbChain.select,
      from: mockDbChain.from,
      where: mockDbChain.where,
    });

    // Mock nostr-tools functions
    Object.assign(nostrTools, {
      SimplePool: vi.fn(() => mockPool),
      getPublicKey: vi.fn(),
      getEventHash: vi.fn(),
      finalizeEvent: vi.fn(),
      nip17: {
        wrapEvent: vi.fn(),
        unwrapEvent: vi.fn(),
        wrapManyEvents: vi.fn(),
        unwrapManyEvents: vi.fn(),
      },
    });

    // Reset environment variables
    delete process.env.DEFAULT_NOSTR_RELAYS;

    service = new NostrService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with SimplePool when available", () => {
      expect(nostrTools.SimplePool).toHaveBeenCalled();
    });

    it("should use mock pool when SimplePool is not available", () => {
      Object.defineProperty(nostrTools, "SimplePool", {
        value: undefined,
        configurable: true,
      });
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const newService = new NostrService();

      expect(consoleSpy).toHaveBeenCalledWith(
        "SimplePool not available in nostr-tools, using mock implementation"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getUserRelays", () => {
    it("should return active user relays", async () => {
      const mockRelays = [
        { userId: "user1", url: "wss://relay1.com", isActive: true },
        { userId: "user1", url: "wss://relay2.com", isActive: false },
        { userId: "user1", url: "wss://relay3.com", isActive: true },
      ];

      mockDbChain.where.mockResolvedValue(mockRelays);

      const result = await service.getUserRelays("user1");

      expect(result).toEqual(["wss://relay1.com", "wss://relay3.com"]);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(nostrRelays);
    });

    it("should return empty array when no relays found", async () => {
      mockDbChain.where.mockResolvedValue([]);

      const result = await service.getUserRelays("user1");

      expect(result).toEqual([]);
    });
  });

  describe("getDefaultRelays", () => {
    it("should return relays from environment variable", () => {
      process.env.DEFAULT_NOSTR_RELAYS =
        "wss://relay1.com,wss://relay2.com,wss://relay3.com";

      const result = service.getDefaultRelays();

      expect(result).toEqual([
        "wss://relay1.com",
        "wss://relay2.com",
        "wss://relay3.com",
      ]);
    });

    it("should return default relays when environment variable not set", () => {
      const result = service.getDefaultRelays();

      expect(result).toEqual([
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.nostr.band",
      ]);
    });
  });

  describe("encryptNIP17Message", () => {
    const mockPrivateKey =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const mockPublicKey =
      "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const mockContent = "Test message";

    beforeEach(() => {
      (nostrTools.getPublicKey as MockedFunction<any>).mockReturnValue(
        mockPublicKey
      );
      (nostrTools.getEventHash as MockedFunction<any>).mockReturnValue(
        "event-hash-123"
      );
      (nostrTools.finalizeEvent as MockedFunction<any>).mockReturnValue({
        id: "event-hash-123",
        pubkey: mockPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 14,
        tags: [],
        content: mockContent,
        sig: "signature-123",
      });
    });

    it("should create and encrypt NIP17 message", async () => {
      const mockGiftWrap: NostrEvent = {
        id: "giftwrap-id",
        pubkey: "giftwrap-pubkey",
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [],
        content: "encrypted-content",
        sig: "giftwrap-sig",
      };

      (nostrTools.nip17.wrapEvent as MockedFunction<any>).mockResolvedValue(
        mockGiftWrap
      );

      const result = await service.encryptNIP17Message(
        mockContent,
        mockPublicKey,
        mockPrivateKey
      );

      expect(result).toEqual(mockGiftWrap);
      expect(nostrTools.getPublicKey).toHaveBeenCalledWith(
        expect.any(Uint8Array)
      );
      expect(nostrTools.nip17.wrapEvent).toHaveBeenCalled();
    });

    it("should fallback to signed message when NIP17 is not available", async () => {
      Object.defineProperty(nostrTools.nip17, "wrapEvent", {
        value: undefined,
        configurable: true,
      });
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await service.encryptNIP17Message(
        mockContent,
        mockPublicKey,
        mockPrivateKey
      );

      expect(result.content).toBe(mockContent);
      expect(result.pubkey).toBe(mockPublicKey);
      expect(consoleSpy).toHaveBeenCalledWith(
        "NIP17 not available, returning signed message without gift wrap"
      );

      consoleSpy.mockRestore();
    });

    it("should handle encryption errors", async () => {
      (nostrTools.getPublicKey as MockedFunction<any>).mockImplementation(
        () => {
          throw new Error("Invalid private key");
        }
      );

      await expect(
        service.encryptNIP17Message(mockContent, mockPublicKey, mockPrivateKey)
      ).rejects.toThrow("Encryption failed");
    });

    it("should handle NIP17 wrapEvent errors gracefully", async () => {
      const error = new Error("Wrap failed");
      (nostrTools.nip17.wrapEvent as MockedFunction<any>).mockRejectedValue(
        error
      );
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await service.encryptNIP17Message(
        mockContent,
        mockPublicKey,
        mockPrivateKey
      );

      expect(consoleSpy).toHaveBeenCalledWith("NIP17 wrapEvent failed:", error);
      expect(result.content).toBe(mockContent);

      consoleSpy.mockRestore();
    });
  });

  describe("decryptNIP17Message", () => {
    const mockGiftWrapEvent: NostrEvent = {
      id: "giftwrap-id",
      pubkey: "giftwrap-pubkey",
      created_at: Math.floor(Date.now() / 1000),
      kind: 1059,
      tags: [],
      content: "encrypted-content",
      sig: "giftwrap-sig",
    };

    const mockDecryptedEvent: NostrEvent = {
      id: "decrypted-id",
      pubkey: "sender-pubkey",
      created_at: Math.floor(Date.now() / 1000),
      kind: 14,
      tags: [["p", "recipient-pubkey"]],
      content: "Decrypted message",
      sig: "decrypted-sig",
    };

    it("should decrypt NIP17 message successfully", async () => {
      (nostrTools.nip17.unwrapEvent as MockedFunction<any>).mockResolvedValue(
        mockDecryptedEvent
      );

      const result = await service.decryptNIP17Message(
        mockGiftWrapEvent,
        "recipient-private-key"
      );

      expect(result).toEqual(mockDecryptedEvent);
      expect(nostrTools.nip17.unwrapEvent).toHaveBeenCalledWith(
        mockGiftWrapEvent,
        expect.any(Uint8Array)
      );
    });

    it("should fallback when NIP17 is not available", async () => {
      Object.defineProperty(nostrTools.nip17, "unwrapEvent", {
        value: undefined,
        configurable: true,
      });
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await service.decryptNIP17Message(
        mockGiftWrapEvent,
        "recipient-private-key"
      );

      expect(result).toEqual(mockGiftWrapEvent);
      expect(consoleSpy).toHaveBeenCalledWith(
        "NIP17 unwrap not available, returning original event"
      );

      consoleSpy.mockRestore();
    });

    it("should handle decryption errors", async () => {
      (nostrTools.nip17.unwrapEvent as MockedFunction<any>).mockRejectedValue(
        new Error("Decryption failed")
      );

      const result = await service.decryptNIP17Message(
        mockGiftWrapEvent,
        "recipient-private-key"
      );

      expect(result).toBeNull();
    });
  });

  describe("storeEncryptedEmail", () => {
    const mockEmailData = {
      subject: "Test Subject",
      content: "Test Content",
      recipients: ["test@example.com"],
    };

    beforeEach(() => {
      mockDbChain.where.mockResolvedValue([
        { url: "wss://relay1.com", isActive: true },
      ]);
    });

    it("should store encrypted email data", async () => {
      const mockEncryptedEvent: NostrEvent = {
        id: "encrypted-event-id",
        pubkey: "sender-pubkey",
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [],
        content: "encrypted-data",
        sig: "signature",
      };

      // Mock the encryptNIP17Message method
      vi.spyOn(service, "encryptNIP17Message").mockResolvedValue(
        mockEncryptedEvent
      );
      mockPool.publish.mockResolvedValue(undefined);

      const result = await service.storeEncryptedEmail(
        "user1",
        mockEmailData,
        "sender-private-key"
      );

      expect(result).toBe("encrypted-event-id");
      expect(mockPool.publish).toHaveBeenCalled();
    });

    it("should use default relays when user has no relays", async () => {
      mockDbChain.where.mockResolvedValue([]);

      const mockEncryptedEvent: NostrEvent = {
        id: "encrypted-event-id",
        pubkey: "sender-pubkey",
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [],
        content: "encrypted-data",
        sig: "signature",
      };

      vi.spyOn(service, "encryptNIP17Message").mockResolvedValue(
        mockEncryptedEvent
      );
      mockPool.publish.mockResolvedValue(undefined);

      await service.storeEncryptedEmail(
        "user1",
        mockEmailData,
        "sender-private-key"
      );

      expect(mockPool.publish).toHaveBeenCalledWith(
        service.getDefaultRelays(),
        mockEncryptedEvent
      );
    });

    it("should handle publish errors", async () => {
      const mockEncryptedEvent: NostrEvent = {
        id: "encrypted-event-id",
        pubkey: "sender-pubkey",
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [],
        content: "encrypted-data",
        sig: "signature",
      };

      vi.spyOn(service, "encryptNIP17Message").mockResolvedValue(
        mockEncryptedEvent
      );
      mockPool.publish.mockRejectedValue(new Error("Publish failed"));

      await expect(
        service.storeEncryptedEmail(
          "user1",
          mockEmailData,
          "sender-private-key"
        )
      ).rejects.toThrow("Failed to store in Nostr");
    });
  });

  describe("retrieveEncryptedEmail", () => {
    it("should retrieve and decrypt email data", async () => {
      const mockEvent: NostrEvent = {
        id: "event-id",
        pubkey: "sender-pubkey",
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [],
        content: "encrypted-content",
        sig: "signature",
      };

      const mockDecryptedEvent: NostrEvent = {
        id: "decrypted-id",
        pubkey: "sender-pubkey",
        created_at: Math.floor(Date.now() / 1000),
        kind: 14,
        tags: [],
        content: JSON.stringify({
          type: "deadman_email",
          subject: "Test Subject",
          content: "Test Content",
          recipients: ["test@example.com"],
          timestamp: Date.now(),
        }),
        sig: "decrypted-sig",
      };

      mockPool.get.mockResolvedValue(mockEvent);
      vi.spyOn(service, "decryptNIP17Message").mockResolvedValue(
        mockDecryptedEvent
      );

      const result = await service.retrieveEncryptedEmail(
        "event-id",
        "recipient-private-key"
      );

      expect(result.subject).toBe("Test Subject");
      expect(result.content).toBe("Test Content");
      expect(result.recipients).toEqual(["test@example.com"]);
    });

    it("should return null when event is not found", async () => {
      mockPool.get.mockResolvedValue(null);

      const result = await service.retrieveEncryptedEmail(
        "non-existent-id",
        "recipient-private-key"
      );

      expect(result).toBeNull();
    });

    it("should return null when decryption fails", async () => {
      const mockEvent: NostrEvent = {
        id: "event-id",
        pubkey: "sender-pubkey",
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [],
        content: "encrypted-content",
        sig: "signature",
      };

      mockPool.get.mockResolvedValue(mockEvent);
      vi.spyOn(service, "decryptNIP17Message").mockResolvedValue(null);

      const result = await service.retrieveEncryptedEmail(
        "event-id",
        "recipient-private-key"
      );

      expect(result).toBeNull();
    });

    it("should handle retrieval errors", async () => {
      mockPool.get.mockRejectedValue(new Error("Network error"));

      const result = await service.retrieveEncryptedEmail(
        "event-id",
        "recipient-private-key"
      );

      expect(result).toBeNull();
    });
  });

  describe("testRelayConnectivity", () => {
    it("should test relay connectivity successfully", async () => {
      const mockTestPool = {
        subscribeMany: vi.fn(),
        close: vi.fn(),
      };

      Object.defineProperty(nostrTools, "SimplePool", {
        value: vi.fn(() => mockTestPool),
        configurable: true,
      });

      const result = await service.testRelayConnectivity(
        "wss://relay.example.com"
      );

      expect(result).toBe(true);
      expect(mockTestPool.subscribeMany).toHaveBeenCalled();
      expect(mockTestPool.close).toHaveBeenCalledWith([
        "wss://relay.example.com",
      ]);
    });

    it("should return false on connection error", async () => {
      const mockTestPool = {
        subscribeMany: vi
          .fn()
          .mockRejectedValue(new Error("Connection failed")),
        close: vi.fn(),
      };

      Object.defineProperty(nostrTools, "SimplePool", {
        value: vi.fn(() => mockTestPool),
        configurable: true,
      });

      const result = await service.testRelayConnectivity(
        "wss://relay.example.com"
      );

      expect(result).toBe(false);
    });

    it("should use mock implementation when SimplePool is not available", async () => {
      Object.defineProperty(nostrTools, "SimplePool", {
        value: undefined,
        configurable: true,
      });
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await service.testRelayConnectivity(
        "wss://relay.example.com"
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        "SimplePool not available, using mock connectivity test"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("sendDeadmanEmailViaNostr", () => {
    const mockEmailData = {
      subject: "Final Message",
      content: "This is my final message",
      recipients: ["friend@example.com"],
    };

    it("should send deadman email notification", async () => {
      (nostrTools.getPublicKey as MockedFunction<any>).mockReturnValue(
        "sender-pubkey"
      );
      (nostrTools.getEventHash as MockedFunction<any>).mockReturnValue(
        "notification-hash"
      );
      (nostrTools.finalizeEvent as MockedFunction<any>).mockReturnValue({
        id: "notification-hash",
        pubkey: "sender-pubkey",
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: [["t", "deadmansswitch"]],
        content:
          "A Dead Man's Switch has been triggered. The designated recipient has been notified via email.",
        sig: "notification-sig",
      });
      mockPool.publish.mockResolvedValue(undefined);

      await service.sendDeadmanEmailViaNostr(
        mockEmailData,
        "sender-private-key"
      );

      expect(mockPool.publish).toHaveBeenCalled();
    });

    it("should handle individual recipient errors", async () => {
      (nostrTools.getPublicKey as MockedFunction<any>).mockImplementation(
        () => {
          throw new Error("Key error");
        }
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await service.sendDeadmanEmailViaNostr(
        mockEmailData,
        "sender-private-key"
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send Nostr notification"),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("close", () => {
    it("should close specific relays", () => {
      const relays = ["wss://relay1.com", "wss://relay2.com"];

      service.close(relays);

      expect(mockPool.close).toHaveBeenCalledWith(relays);
    });

    it("should close default relays when no specific relays provided", () => {
      service.close();

      expect(mockPool.close).toHaveBeenCalledWith(service.getDefaultRelays());
    });
  });

  describe("singleton export", () => {
    it("should export singleton instance", () => {
      expect(nostrService).toBeInstanceOf(NostrService);
    });
  });
});
