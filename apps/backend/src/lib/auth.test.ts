import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import {
  generateTempPassword,
  generateToken,
  verifyToken,
  generateNostrKeypair,
  encryptData,
  decryptData,
  type TokenPayload,
} from "./auth";

// Mock dependencies
vi.mock("jsonwebtoken", () => ({
  sign: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("crypto", async () => {
  const actual = await vi.importActual("crypto");
  return {
    ...actual,
    randomBytes: vi.fn().mockReturnValue(Buffer.from("test-bytes")),
    createCipher: vi.fn(),
    createDecipher: vi.fn(),
  };
});

vi.mock("../db/connection");

const mockedJwt = vi.mocked(jwt);
const mockedCrypto = vi.mocked(crypto);

describe("Auth Library", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset environment variables
    delete process.env.JWT_SECRET;
    delete process.env.ENCRYPTION_KEY;

    // Mock console methods
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateTempPassword", () => {
    it("should generate a random hex password", () => {
      const mockBuffer = Buffer.from("test-random-bytes");
      (mockedCrypto.randomBytes as any).mockReturnValue(mockBuffer);

      const result = generateTempPassword();

      expect(mockedCrypto.randomBytes).toHaveBeenCalledWith(16);
      expect(result).toBe(mockBuffer.toString("hex"));
    });

    it("should generate different passwords on multiple calls", () => {
      const mockBuffer1 = Buffer.from("test-random-1");
      const mockBuffer2 = Buffer.from("test-random-2");

      (mockedCrypto.randomBytes as any)
        .mockReturnValueOnce(mockBuffer1)
        .mockReturnValueOnce(mockBuffer2);

      const password1 = generateTempPassword();
      const password2 = generateTempPassword();

      expect(password1).toBe(mockBuffer1.toString("hex"));
      expect(password2).toBe(mockBuffer2.toString("hex"));
      expect(password1).not.toBe(password2);
    });
  });

  describe("generateToken", () => {
    const mockPayload: TokenPayload = {
      userId: "user-123",
      email: "test@example.com",
      nostrPublicKey: "npub123...",
      tier: "premium",
    };

    it("should generate a JWT token with default secret", () => {
      const mockToken = "mock.jwt.token";
      (mockedJwt.sign as any).mockReturnValue(mockToken);

      const result = generateToken(mockPayload);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        "your-secret-key-change-in-production",
        { expiresIn: "24h" }
      );
      expect(result).toBe(mockToken);
    });

    it("should use JWT_SECRET environment variable when set", () => {
      const originalEnv = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "custom-secret-key";

      const mockToken = "mock.jwt.token";
      (mockedJwt.sign as any).mockReturnValue(mockToken);

      const result = generateToken(mockPayload);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        "custom-secret-key",
        { expiresIn: "24h" }
      );
      expect(result).toBe(mockToken);

      // Restore original environment variable
      if (originalEnv) {
        process.env.JWT_SECRET = originalEnv;
      } else {
        delete process.env.JWT_SECRET;
      }
    });

    it("should handle minimal payload", () => {
      const minimalPayload: TokenPayload = {
        userId: "user-456",
        tier: "free",
      };
      const mockToken = "minimal.jwt.token";
      (mockedJwt.sign as any).mockReturnValue(mockToken);

      const result = generateToken(minimalPayload);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        minimalPayload,
        "your-secret-key-change-in-production",
        { expiresIn: "24h" }
      );
      expect(result).toBe(mockToken);
    });
  });

  describe("verifyToken", () => {
    const mockPayload: TokenPayload = {
      userId: "user-123",
      email: "test@example.com",
      tier: "premium",
    };

    it("should verify a valid JWT token", async () => {
      (mockedJwt.verify as any).mockReturnValue(mockPayload);

      const result = await verifyToken("valid.jwt.token");

      expect(mockedJwt.verify).toHaveBeenCalledWith(
        "valid.jwt.token",
        "your-secret-key-change-in-production"
      );
      expect(result).toEqual(mockPayload);
    });

    it("should use custom JWT secret from environment", async () => {
      const originalEnv = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "env-secret-key";

      (mockedJwt.verify as any).mockReturnValue(mockPayload);

      const result = await verifyToken("valid.jwt.token");

      expect(mockedJwt.verify).toHaveBeenCalledWith(
        "valid.jwt.token",
        "env-secret-key"
      );
      expect(result).toEqual(mockPayload);

      // Restore original environment variable
      if (originalEnv) {
        process.env.JWT_SECRET = originalEnv;
      } else {
        delete process.env.JWT_SECRET;
      }
    });

    it("should throw error for invalid token", async () => {
      (mockedJwt.verify as any).mockImplementation(() => {
        throw new Error("JWT verification failed");
      });

      await expect(verifyToken("invalid.jwt.token")).rejects.toThrow(
        "Invalid token"
      );

      expect(mockedJwt.verify).toHaveBeenCalledWith(
        "invalid.jwt.token",
        "your-secret-key-change-in-production"
      );
    });

    it("should throw error for expired token", async () => {
      (mockedJwt.verify as any).mockImplementation(() => {
        throw new Error("TokenExpiredError");
      });

      await expect(verifyToken("expired.jwt.token")).rejects.toThrow(
        "Invalid token"
      );
    });
  });

  describe("generateNostrKeypair", () => {
    it("should generate keypair using nostr-tools", async () => {
      const mockPrivateKey = "mock-private-key";
      const mockPublicKey = "mock-public-key";
      const mockBuffer = Buffer.from(mockPrivateKey);

      (mockedCrypto.randomBytes as any).mockReturnValue(mockBuffer);

      // Mock dynamic import
      vi.doMock("nostr-tools", () => ({
        getPublicKey: vi.fn().mockReturnValue(mockPublicKey),
      }));

      const result = await generateNostrKeypair();

      expect(mockedCrypto.randomBytes).toHaveBeenCalledWith(32);
      expect(result).toEqual({
        privateKey: mockBuffer.toString("hex"),
        publicKey: mockPublicKey,
      });
    });

    it("should use fallback when nostr-tools import fails", async () => {
      const mockPrivateKey = "fallback-private-key";
      const mockBuffer = Buffer.from(mockPrivateKey);

      (mockedCrypto.randomBytes as any).mockReturnValue(mockBuffer);

      // Mock failed import
      vi.doMock("nostr-tools", () => {
        throw new Error("Module not found");
      });

      const result = await generateNostrKeypair();

      expect(console.warn).toHaveBeenCalledWith(
        "Failed to import nostr-tools, using fallback keypair generation"
      );
      expect(result).toEqual({
        privateKey: mockBuffer.toString("hex"),
        publicKey: mockBuffer.toString("hex") + "_pubkey",
      });
    });

    it("should use fallback when getPublicKey is not available", async () => {
      const mockPrivateKey = "no-getpubkey-private";
      const mockBuffer = Buffer.from(mockPrivateKey);

      (mockedCrypto.randomBytes as any).mockReturnValue(mockBuffer);

      // Mock import without getPublicKey
      vi.doMock("nostr-tools", () => ({}));

      const result = await generateNostrKeypair();

      expect(result).toEqual({
        privateKey: mockBuffer.toString("hex"),
        publicKey: mockBuffer.toString("hex") + "_pubkey",
      });
    });
  });

  describe("encryptData", () => {
    const mockCipher = {
      update: vi.fn(),
      final: vi.fn(),
    };

    beforeEach(() => {
      mockedCrypto.createCipher.mockReturnValue(mockCipher as any);
      mockCipher.update.mockReturnValue("encrypted-part");
      mockCipher.final.mockReturnValue("final-part");
    });

    it("should encrypt data with default key", () => {
      const data = "sensitive-data";

      const result = encryptData(data);

      expect(mockedCrypto.createCipher).toHaveBeenCalledWith(
        "aes-256-cbc",
        "default-key"
      );
      expect(mockCipher.update).toHaveBeenCalledWith(data, "utf8", "hex");
      expect(mockCipher.final).toHaveBeenCalledWith("hex");
      expect(result).toBe("encrypted-partfinal-part");
    });

    it("should encrypt data with custom key", () => {
      const data = "secret-info";
      const customKey = "custom-encryption-key";

      const result = encryptData(data, customKey);

      expect(mockedCrypto.createCipher).toHaveBeenCalledWith(
        "aes-256-cbc",
        customKey
      );
      expect(result).toBe("encrypted-partfinal-part");
    });

    it("should use environment variable for encryption key", () => {
      process.env.ENCRYPTION_KEY = "env-encryption-key";
      const data = "env-encrypted-data";

      const result = encryptData(data);

      expect(mockedCrypto.createCipher).toHaveBeenCalledWith(
        "aes-256-cbc",
        "env-encryption-key"
      );
      expect(result).toBe("encrypted-partfinal-part");
    });
  });

  describe("decryptData", () => {
    const mockDecipher = {
      update: vi.fn(),
      final: vi.fn(),
    };

    beforeEach(() => {
      mockedCrypto.createDecipher.mockReturnValue(mockDecipher as any);
      mockDecipher.update.mockReturnValue("decrypted-part");
      mockDecipher.final.mockReturnValue("final-part");
    });

    it("should decrypt data with default key", () => {
      const encryptedData = "encrypted-hex-data";

      const result = decryptData(encryptedData);

      expect(mockedCrypto.createDecipher).toHaveBeenCalledWith(
        "aes-256-cbc",
        "default-key"
      );
      expect(mockDecipher.update).toHaveBeenCalledWith(
        encryptedData,
        "hex",
        "utf8"
      );
      expect(mockDecipher.final).toHaveBeenCalledWith("utf8");
      expect(result).toBe("decrypted-partfinal-part");
    });

    it("should decrypt data with custom key", () => {
      const encryptedData = "custom-encrypted-data";
      const customKey = "custom-decryption-key";

      const result = decryptData(encryptedData, customKey);

      expect(mockedCrypto.createDecipher).toHaveBeenCalledWith(
        "aes-256-cbc",
        customKey
      );
      expect(result).toBe("decrypted-partfinal-part");
    });

    it("should use environment variable for decryption key", () => {
      process.env.ENCRYPTION_KEY = "env-decryption-key";
      const encryptedData = "env-encrypted-hex";

      const result = decryptData(encryptedData);

      expect(mockedCrypto.createDecipher).toHaveBeenCalledWith(
        "aes-256-cbc",
        "env-decryption-key"
      );
      expect(result).toBe("decrypted-partfinal-part");
    });
  });

  describe("integration scenarios", () => {
    it("should encrypt and decrypt data roundtrip", () => {
      const originalData = "test-roundtrip-data";
      const key = "test-encryption-key";

      // Setup mocks for encryption
      const mockCipher = {
        update: vi.fn().mockReturnValue("encrypted-"),
        final: vi.fn().mockReturnValue("data"),
      };
      mockedCrypto.createCipher.mockReturnValue(mockCipher as any);

      // Setup mocks for decryption
      const mockDecipher = {
        update: vi.fn().mockReturnValue("test-roundtrip-"),
        final: vi.fn().mockReturnValue("data"),
      };
      mockedCrypto.createDecipher.mockReturnValue(mockDecipher as any);

      const encrypted = encryptData(originalData, key);
      const decrypted = decryptData(encrypted, key);

      expect(encrypted).toBe("encrypted-data");
      expect(decrypted).toBe("test-roundtrip-data");
      expect(mockedCrypto.createCipher).toHaveBeenCalledWith(
        "aes-256-cbc",
        key
      );
      expect(mockedCrypto.createDecipher).toHaveBeenCalledWith(
        "aes-256-cbc",
        key
      );
    });

    it("should generate unique temp passwords for different calls", () => {
      mockedCrypto.randomBytes
        .mockReturnValueOnce(Buffer.from("unique1"))
        .mockReturnValueOnce(Buffer.from("unique2"));

      const password1 = generateTempPassword();
      const password2 = generateTempPassword();

      expect(password1).not.toBe(password2);
      expect(password1).toBe(Buffer.from("unique1").toString("hex"));
      expect(password2).toBe(Buffer.from("unique2").toString("hex"));
    });

    it("should handle token generation and verification flow", async () => {
      const payload: TokenPayload = {
        userId: "flow-test-user",
        email: "flow@test.com",
        tier: "lifetime",
      };

      // Mock token generation
      mockedJwt.sign.mockReturnValue("generated.token.here");

      // Mock token verification
      mockedJwt.verify.mockReturnValue(payload);

      const token = generateToken(payload);
      const verifiedPayload = await verifyToken(token);

      expect(token).toBe("generated.token.here");
      expect(verifiedPayload).toEqual(payload);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        payload,
        "your-secret-key-change-in-production",
        { expiresIn: "24h" }
      );
      expect(mockedJwt.verify).toHaveBeenCalledWith(
        token,
        "your-secret-key-change-in-production"
      );
    });
  });
});
