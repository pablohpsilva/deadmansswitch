import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createContext, type TRPCContext } from "./context";
import { verifyToken } from "./auth";
import { db } from "../db/connection";

// Mock dependencies
vi.mock("./auth");
vi.mock("../db/connection");

const mockedVerifyToken = vi.mocked(verifyToken);

describe("Context Library", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createContext", () => {
    it("should create context with authenticated user from Hono request", async () => {
      const mockUser = {
        userId: "user-123",
        email: "test@example.com",
        nostrPublicKey: "npub123",
        tier: "premium" as const,
      };

      mockedVerifyToken.mockResolvedValue(mockUser);

      const mockHonoContext = {
        req: {
          header: vi.fn().mockReturnValue("Bearer valid-token"),
        },
      } as any;

      const result = await createContext({ c: mockHonoContext });

      expect(result).toEqual({
        user: mockUser,
        db,
      });

      expect(mockHonoContext.req.header).toHaveBeenCalledWith("authorization");
      expect(mockedVerifyToken).toHaveBeenCalledWith("valid-token");
    });

    it("should create context with authenticated user from standard request", async () => {
      const mockUser = {
        userId: "user-456",
        email: "standard@example.com",
        tier: "free" as const,
      };

      mockedVerifyToken.mockResolvedValue(mockUser);

      const mockStandardRequest = {
        headers: {
          authorization: "Bearer standard-token",
        },
      };

      const result = await createContext({ req: mockStandardRequest });

      expect(result).toEqual({
        user: mockUser,
        db,
      });

      expect(mockedVerifyToken).toHaveBeenCalledWith("standard-token");
    });

    it("should create context without user when no authorization header", async () => {
      const mockHonoContext = {
        req: {
          header: vi.fn().mockReturnValue(undefined),
        },
      } as any;

      const result = await createContext({ c: mockHonoContext });

      expect(result).toEqual({
        user: undefined,
        db,
      });

      expect(mockHonoContext.req.header).toHaveBeenCalledWith("authorization");
      expect(mockedVerifyToken).not.toHaveBeenCalled();
    });

    it("should create context without user when authorization header is empty", async () => {
      const mockStandardRequest = {
        headers: {
          authorization: "",
        },
      };

      const result = await createContext({ req: mockStandardRequest });

      expect(result).toEqual({
        user: undefined,
        db,
      });

      expect(mockedVerifyToken).not.toHaveBeenCalled();
    });

    it("should handle invalid token gracefully", async () => {
      mockedVerifyToken.mockRejectedValue(new Error("Invalid token"));

      const mockHonoContext = {
        req: {
          header: vi.fn().mockReturnValue("Bearer invalid-token"),
        },
      } as any;

      const result = await createContext({ c: mockHonoContext });

      expect(result).toEqual({
        user: undefined,
        db,
      });

      expect(mockedVerifyToken).toHaveBeenCalledWith("invalid-token");
      expect(console.warn).toHaveBeenCalledWith(
        "Invalid token:",
        expect.any(Error)
      );
    });

    it("should handle expired token gracefully", async () => {
      mockedVerifyToken.mockRejectedValue(new Error("Token expired"));

      const mockStandardRequest = {
        headers: {
          authorization: "Bearer expired-token",
        },
      };

      const result = await createContext({ req: mockStandardRequest });

      expect(result).toEqual({
        user: undefined,
        db,
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Invalid token:",
        expect.any(Error)
      );
    });

    it("should extract token from Bearer header correctly", async () => {
      const mockUser = {
        userId: "bearer-test",
        tier: "lifetime" as const,
      };

      mockedVerifyToken.mockResolvedValue(mockUser);

      const mockRequest = {
        headers: {
          authorization: "Bearer my-secret-token",
        },
      };

      await createContext({ req: mockRequest });

      expect(mockedVerifyToken).toHaveBeenCalledWith("my-secret-token");
    });

    it("should handle malformed authorization header", async () => {
      const mockRequest = {
        headers: {
          authorization: "NotBearer invalid-format",
        },
      };

      const result = await createContext({ req: mockRequest });

      expect(result).toEqual({
        user: undefined,
        db,
      });

      expect(mockedVerifyToken).not.toHaveBeenCalled();
    });

    it("should handle authorization header without Bearer prefix", async () => {
      const mockRequest = {
        headers: {
          authorization: "just-a-token",
        },
      };

      const result = await createContext({ req: mockRequest });

      expect(result).toEqual({
        user: undefined,
        db,
      });

      expect(mockedVerifyToken).not.toHaveBeenCalled();
    });

    it("should prefer Hono context over standard request when both provided", async () => {
      const mockUser = {
        userId: "hono-preference-test",
        tier: "premium" as const,
      };

      mockedVerifyToken.mockResolvedValue(mockUser);

      const mockHonoContext = {
        req: {
          header: vi.fn().mockReturnValue("Bearer hono-token"),
        },
      } as any;

      const mockStandardRequest = {
        headers: {
          authorization: "Bearer standard-token",
        },
      };

      await createContext({ c: mockHonoContext, req: mockStandardRequest });

      expect(mockHonoContext.req.header).toHaveBeenCalledWith("authorization");
      expect(mockedVerifyToken).toHaveBeenCalledWith("hono-token");
    });

    it("should handle missing headers object in standard request", async () => {
      const mockRequest = {};

      const result = await createContext({ req: mockRequest });

      expect(result).toEqual({
        user: undefined,
        db,
      });

      expect(mockedVerifyToken).not.toHaveBeenCalled();
    });

    it("should handle missing req object in Hono context", async () => {
      const mockHonoContext = {} as any;

      const result = await createContext({ c: mockHonoContext });

      expect(result).toEqual({
        user: undefined,
        db,
      });

      expect(mockedVerifyToken).not.toHaveBeenCalled();
    });
  });

  describe("context type validation", () => {
    it("should create context with all user properties", async () => {
      const fullUser = {
        userId: "full-user-123",
        email: "full@example.com",
        nostrPublicKey: "npub123456789",
        tier: "lifetime" as const,
      };

      mockedVerifyToken.mockResolvedValue(fullUser);

      const mockRequest = {
        headers: {
          authorization: "Bearer full-token",
        },
      };

      const result = await createContext({ req: mockRequest });

      expect(result.user).toEqual(fullUser);
      expect(result.db).toBe(db);

      // Type checking
      const context: TRPCContext = result;
      expect(context.user?.userId).toBe("full-user-123");
      expect(context.user?.email).toBe("full@example.com");
      expect(context.user?.nostrPublicKey).toBe("npub123456789");
      expect(context.user?.tier).toBe("lifetime");
    });

    it("should create context with minimal user properties", async () => {
      const minimalUser = {
        userId: "minimal-user",
        tier: "free" as const,
      };

      mockedVerifyToken.mockResolvedValue(minimalUser);

      const mockRequest = {
        headers: {
          authorization: "Bearer minimal-token",
        },
      };

      const result = await createContext({ req: mockRequest });

      expect(result.user).toEqual(minimalUser);
      expect(result.user?.email).toBeUndefined();
      expect(result.user?.nostrPublicKey).toBeUndefined();
    });

    it("should handle different user tiers", async () => {
      const tiers = ["free", "premium", "lifetime"] as const;

      for (const tier of tiers) {
        mockedVerifyToken.mockResolvedValue({
          userId: `user-${tier}`,
          tier,
        });

        const result = await createContext({
          req: { headers: { authorization: `Bearer ${tier}-token` } },
        });

        expect(result.user?.tier).toBe(tier);
      }

      expect(mockedVerifyToken).toHaveBeenCalledTimes(3);
    });
  });

  describe("integration scenarios", () => {
    it("should handle rapid sequential context creation", async () => {
      const users = [
        { userId: "user1", tier: "free" as const },
        { userId: "user2", tier: "premium" as const },
        { userId: "user3", tier: "lifetime" as const },
      ];

      mockedVerifyToken
        .mockResolvedValueOnce(users[0])
        .mockResolvedValueOnce(users[1])
        .mockResolvedValueOnce(users[2]);

      const requests = [
        { headers: { authorization: "Bearer token1" } },
        { headers: { authorization: "Bearer token2" } },
        { headers: { authorization: "Bearer token3" } },
      ];

      const results = await Promise.all(
        requests.map((req) => createContext({ req }))
      );

      expect(results[0].user).toEqual(users[0]);
      expect(results[1].user).toEqual(users[1]);
      expect(results[2].user).toEqual(users[2]);

      expect(mockedVerifyToken).toHaveBeenCalledTimes(3);
    });

    it("should handle mixed authentication scenarios", async () => {
      const validUser = { userId: "valid-user", tier: "premium" as const };

      mockedVerifyToken
        .mockResolvedValueOnce(validUser)
        .mockRejectedValueOnce(new Error("Invalid token"));

      const validRequest = {
        headers: { authorization: "Bearer valid-token" },
      };
      const invalidRequest = {
        headers: { authorization: "Bearer invalid-token" },
      };
      const noAuthRequest = { headers: {} };

      const results = await Promise.all([
        createContext({ req: validRequest }),
        createContext({ req: invalidRequest }),
        createContext({ req: noAuthRequest }),
      ]);

      expect(results[0].user).toEqual(validUser);
      expect(results[1].user).toBeUndefined();
      expect(results[2].user).toBeUndefined();

      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("should maintain consistent database reference", async () => {
      const contexts = await Promise.all([
        createContext({ req: { headers: {} } }),
        createContext({ c: { req: { header: () => undefined } } }),
        createContext({ req: { headers: { authorization: "Bearer test" } } }),
      ]);

      contexts.forEach((context) => {
        expect(context.db).toBe(db);
      });
    });
  });

  describe("error handling", () => {
    it("should handle undefined context gracefully", async () => {
      const result = await createContext({});

      expect(result).toEqual({
        user: undefined,
        db,
      });
    });

    it("should handle null values in request", async () => {
      const mockRequest = {
        headers: {
          authorization: null,
        },
      };

      const result = await createContext({ req: mockRequest as any });

      expect(result).toEqual({
        user: undefined,
        db,
      });
    });

    it("should handle token verification timeout", async () => {
      mockedVerifyToken.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10)
          )
      );

      const mockRequest = {
        headers: { authorization: "Bearer slow-token" },
      };

      const result = await createContext({ req: mockRequest });

      expect(result.user).toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
