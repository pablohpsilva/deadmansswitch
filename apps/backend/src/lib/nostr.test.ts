import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as nostrTools from "nostr-tools";
import {
  verifyNostrSignature,
  generatePublicKeyFromPrivate,
  validateNostrEvent,
  type NostrEvent,
} from "./nostr";

// Mock nostr-tools
vi.mock("nostr-tools");

const mockedNostrTools = vi.mocked(nostrTools);

describe("Nostr Library", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("verifyNostrSignature", () => {
    const mockPublicKey = "npub1234567890abcdef";
    const mockSignature = "sig1234567890abcdef";
    const mockMessage = "test message to verify";

    it("should verify signature using verifyEvent when available", async () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const result = await verifyNostrSignature(
        mockPublicKey,
        mockSignature,
        mockMessage
      );

      expect(result).toBe(true);
      expect(mockedNostrTools.verifyEvent).toHaveBeenCalledWith({
        pubkey: mockPublicKey,
        content: mockMessage,
        sig: mockSignature,
        id: "",
        created_at: expect.any(Number),
        kind: 1,
        tags: [],
      });
    });

    it("should use fallback when no verification method available", async () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: undefined,
        configurable: true,
      });

      const result = await verifyNostrSignature(
        mockPublicKey,
        mockSignature,
        mockMessage
      );

      expect(result).toBe(true);
      expect(console.warn).toHaveBeenCalledWith(
        "No verification method available in nostr-tools"
      );
    });

    it("should return false when verification fails", async () => {
      (mockedNostrTools as any).verifyEvent = vi.fn().mockReturnValue(false);

      const result = await verifyNostrSignature(
        mockPublicKey,
        mockSignature,
        mockMessage
      );

      expect(result).toBe(false);
    });

    it("should handle verification errors gracefully", async () => {
      (mockedNostrTools as any).verifyEvent = vi.fn().mockImplementation(() => {
        throw new Error("Verification error");
      });

      const result = await verifyNostrSignature(
        mockPublicKey,
        mockSignature,
        mockMessage
      );

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Nostr signature verification error:",
        expect.any(Error)
      );
    });

    it("should create proper event structure with correct timestamp", async () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });
      const beforeTime = Math.floor(Date.now() / 1000);

      await verifyNostrSignature(mockPublicKey, mockSignature, mockMessage);

      const afterTime = Math.floor(Date.now() / 1000);
      const calledEvent = (mockedNostrTools.verifyEvent as any).mock
        .calls[0][0];

      expect(calledEvent.created_at).toBeGreaterThanOrEqual(beforeTime);
      expect(calledEvent.created_at).toBeLessThanOrEqual(afterTime);
      expect(calledEvent.kind).toBe(1);
      expect(calledEvent.tags).toEqual([]);
    });
  });

  describe("generatePublicKeyFromPrivate", () => {
    const mockPrivateKey = "priv1234567890abcdef";
    const mockPublicKey = "pub1234567890abcdef";

    it("should generate public key using getPublicKey when available", () => {
      Object.defineProperty(mockedNostrTools, "getPublicKey", {
        value: vi.fn().mockReturnValue(mockPublicKey),
        configurable: true,
      });

      const result = generatePublicKeyFromPrivate(mockPrivateKey);

      expect(result).toBe(mockPublicKey);
      expect(mockedNostrTools.getPublicKey).toHaveBeenCalledWith(
        expect.any(Uint8Array)
      );
    });

    it("should use fallback when getPublicKey not available", () => {
      Object.defineProperty(mockedNostrTools, "getPublicKey", {
        value: undefined,
        configurable: true,
      });

      const result = generatePublicKeyFromPrivate(mockPrivateKey);

      expect(result).toBe(mockPrivateKey + "_pubkey");
      expect(console.warn).toHaveBeenCalledWith(
        "getPublicKey not available in nostr-tools, using fallback"
      );
    });

    it("should handle errors when generating public key", () => {
      Object.defineProperty(mockedNostrTools, "getPublicKey", {
        value: vi.fn().mockImplementation(() => {
          throw new Error("Invalid private key format");
        }),
        configurable: true,
      });

      expect(() => generatePublicKeyFromPrivate(mockPrivateKey)).toThrow(
        "Invalid private key"
      );

      expect(console.error).toHaveBeenCalledWith(
        "Failed to generate public key:",
        expect.any(Error)
      );
    });

    it("should handle different private key formats", () => {
      Object.defineProperty(mockedNostrTools, "getPublicKey", {
        value: vi.fn().mockReturnValue("generated-key"),
        configurable: true,
      });

      const hexKey = "abcdef1234567890";
      const result1 = generatePublicKeyFromPrivate(hexKey);

      const longKey =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const result2 = generatePublicKeyFromPrivate(longKey);

      expect(result1).toBe("generated-key");
      expect(result2).toBe("generated-key");
      expect(mockedNostrTools.getPublicKey).toHaveBeenCalledTimes(2);
    });
  });

  describe("validateNostrEvent", () => {
    const mockEvent: NostrEvent = {
      id: "event123",
      pubkey: "pubkey123",
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [["t", "hashtag"]],
      content: "Hello Nostr!",
      sig: "signature123",
    };

    it("should validate event using verifyEvent when available", () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const result = validateNostrEvent(mockEvent);

      expect(result).toBe(true);
      expect(mockedNostrTools.verifyEvent).toHaveBeenCalledWith(mockEvent);
    });

    it("should use fallback validation when verifyEvent not available", () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: undefined,
        configurable: true,
      });

      const result = validateNostrEvent(mockEvent);

      expect(result).toBe(true);
    });

    it("should use fallback validation when no method available", () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: undefined,
        configurable: true,
      });

      const result = validateNostrEvent(mockEvent);

      expect(result).toBe(true);
    });

    it("should return false for invalid events", () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(false),
        configurable: true,
      });

      const result = validateNostrEvent(mockEvent);

      expect(result).toBe(false);
    });

    it("should handle validation errors gracefully", () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockImplementation(() => {
          throw new Error("Validation error");
        }),
        configurable: true,
      });

      const result = validateNostrEvent(mockEvent);

      expect(result).toBe(false);
    });

    it("should validate different event kinds", () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const textEvent = { ...mockEvent, kind: 1 };
      const reactionEvent = { ...mockEvent, kind: 7 };
      const dmEvent = { ...mockEvent, kind: 4 };

      expect(validateNostrEvent(textEvent)).toBe(true);
      expect(validateNostrEvent(reactionEvent)).toBe(true);
      expect(validateNostrEvent(dmEvent)).toBe(true);

      expect(mockedNostrTools.verifyEvent).toHaveBeenCalledTimes(3);
    });

    it("should validate events with different tag structures", () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const noTagsEvent = { ...mockEvent, tags: [] };
      const multipleTagsEvent = {
        ...mockEvent,
        tags: [
          ["e", "event-id"],
          ["p", "pubkey"],
          ["t", "tag1"],
          ["t", "tag2"],
        ],
      };

      expect(validateNostrEvent(noTagsEvent)).toBe(true);
      expect(validateNostrEvent(multipleTagsEvent)).toBe(true);

      expect(mockedNostrTools.verifyEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete signature verification flow", async () => {
      const privateKey = "test-private-key";
      const publicKey = "test-public-key";
      const message = "test message";
      const signature = "test-signature";

      // Mock public key generation
      (mockedNostrTools as any).getPublicKey = vi
        .fn()
        .mockReturnValue(publicKey);

      // Mock signature verification
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const generatedPubkey = generatePublicKeyFromPrivate(privateKey);
      const isValid = await verifyNostrSignature(
        generatedPubkey,
        signature,
        message
      );

      expect(generatedPubkey).toBe(publicKey);
      expect(isValid).toBe(true);
      expect(mockedNostrTools.getPublicKey).toHaveBeenCalledWith(
        expect.any(Uint8Array)
      );
    });

    it("should handle event creation and validation flow", async () => {
      const privateKey = "flow-private-key";
      const publicKey = "flow-public-key";
      const message = "flow test message";
      const signature = "flow-signature";

      // Mock key generation
      Object.defineProperty(mockedNostrTools, "getPublicKey", {
        value: vi.fn().mockReturnValue(publicKey),
        configurable: true,
      });

      // Mock event validation
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const generatedPubkey = generatePublicKeyFromPrivate(privateKey);

      // Create event manually
      const event: NostrEvent = {
        id: "flow-event-id",
        pubkey: generatedPubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: [],
        content: message,
        sig: signature,
      };

      const isEventValid = validateNostrEvent(event);
      const isSignatureValid = await verifyNostrSignature(
        generatedPubkey,
        signature,
        message
      );

      expect(generatedPubkey).toBe(publicKey);
      expect(isEventValid).toBe(true);
      expect(isSignatureValid).toBe(true);
    });

    it("should handle fallback scenarios consistently", async () => {
      // No nostr-tools methods available
      Object.defineProperty(mockedNostrTools, "getPublicKey", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: undefined,
        configurable: true,
      });

      const privateKey = "fallback-private";
      const message = "fallback message";
      const signature = "fallback-sig";

      const publicKey = generatePublicKeyFromPrivate(privateKey);
      const isValid = await verifyNostrSignature(publicKey, signature, message);

      const mockEvent: NostrEvent = {
        id: "fallback-event",
        pubkey: publicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: [],
        content: message,
        sig: signature,
      };
      const eventValid = validateNostrEvent(mockEvent);

      expect(publicKey).toBe(privateKey + "_pubkey");
      expect(isValid).toBe(true); // Fallback returns true
      expect(eventValid).toBe(true); // Fallback returns true
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    it("should handle error scenarios gracefully", async () => {
      // Setup methods that throw errors
      Object.defineProperty(mockedNostrTools, "getPublicKey", {
        value: vi.fn().mockImplementation(() => {
          throw new Error("Key generation error");
        }),
        configurable: true,
      });
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockImplementation(() => {
          throw new Error("Event verification error");
        }),
        configurable: true,
      });

      const privateKey = "error-private-key";
      const message = "error test message";
      const signature = "error-signature";

      // Public key generation should throw
      expect(() => generatePublicKeyFromPrivate(privateKey)).toThrow(
        "Invalid private key"
      );

      // Signature verification should return false
      const isValid = await verifyNostrSignature(
        "some-pubkey",
        signature,
        message
      );
      expect(isValid).toBe(false);

      const mockEvent: NostrEvent = {
        id: "error-event",
        pubkey: "error-pubkey",
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: [],
        content: message,
        sig: signature,
      };
      const eventValid = validateNostrEvent(mockEvent);
      expect(eventValid).toBe(false);

      expect(console.error).toHaveBeenCalledTimes(2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings", async () => {
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const result = await verifyNostrSignature("", "", "");

      expect(result).toBe(true);
      expect(mockedNostrTools.verifyEvent).toHaveBeenCalledWith({
        pubkey: "",
        content: "",
        sig: "",
        id: "",
        created_at: expect.any(Number),
        kind: 1,
        tags: [],
      });
    });

    it("should handle very long inputs", async () => {
      const longString = "a".repeat(10000);
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const result = await verifyNostrSignature(
        longString,
        longString,
        longString
      );

      expect(result).toBe(true);
      expect(mockedNostrTools.verifyEvent).toHaveBeenCalledWith({
        pubkey: longString,
        content: longString,
        sig: longString,
        id: "",
        created_at: expect.any(Number),
        kind: 1,
        tags: [],
      });
    });

    it("should handle special characters in content", async () => {
      const specialContent =
        "Hello! 🚀 Test with émojis and spéciál chars: @#$%^&*()";
      Object.defineProperty(mockedNostrTools, "verifyEvent", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      const result = await verifyNostrSignature(
        "pubkey",
        "sig",
        specialContent
      );

      expect(result).toBe(true);
      expect(mockedNostrTools.verifyEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: specialContent,
        })
      );
    });
  });
});
