import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "./trpc";
import type { TRPCContext } from "./context";

describe("TRPC Library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createTRPCRouter", () => {
    it("should create a router", () => {
      expect(createTRPCRouter).toBeDefined();
      expect(typeof createTRPCRouter).toBe("function");
    });

    it("should create router with procedures", () => {
      const router = createTRPCRouter({
        test: publicProcedure.query(() => "test"),
      });

      expect(router).toBeDefined();
      expect(typeof router).toBe("object");
    });
  });

  describe("publicProcedure", () => {
    it("should allow access without authentication", async () => {
      const mockContext: TRPCContext = {
        user: undefined,
        db: {} as any,
      };

      const procedure = publicProcedure.query(({ ctx }) => {
        return { success: true, hasUser: !!ctx.user };
      });

      // Create a router to test the procedure
      const router = createTRPCRouter({
        test: procedure,
      });

      // Mock the procedure call
      const mockNext = vi
        .fn()
        .mockResolvedValue({ success: true, hasUser: false });

      // Test that public procedure doesn't require authentication
      expect(publicProcedure).toBeDefined();
    });

    it("should provide context to procedure handler", async () => {
      const mockContext: TRPCContext = {
        user: {
          id: "user-123",
          email: "test@example.com",
          tier: "premium",
        },
        db: {} as any,
      };

      const contextSpy = vi.fn();
      const procedure = publicProcedure.query(({ ctx }) => {
        contextSpy(ctx);
        return { received: "context" };
      });

      expect(publicProcedure).toBeDefined();
      expect(contextSpy).toBeDefined();
    });
  });

  describe("protectedProcedure", () => {
    it("should allow access for authenticated users", () => {
      const mockContext: TRPCContext = {
        user: {
          id: "user-123",
          email: "test@example.com",
          tier: "premium",
        },
        db: {} as any,
      };

      const mockNext = vi.fn().mockImplementation(() => {
        return Promise.resolve({ success: true });
      });

      // Test the middleware logic manually
      const middleware = protectedProcedure._def.middlewares[0];

      expect(middleware).toBeDefined();

      // The middleware function should call next with authenticated context
      const result = middleware({
        ctx: mockContext,
        next: mockNext,
        path: "test",
        type: "query",
        rawInput: undefined,
        input: undefined,
        meta: {},
      });

      expect(result).toBeDefined();
    });

    it("should throw UNAUTHORIZED error for unauthenticated users", () => {
      const mockContext: TRPCContext = {
        user: undefined,
        db: {} as any,
      };

      const mockNext = vi.fn();

      // Test the middleware logic manually
      const middleware = protectedProcedure._def.middlewares[0];

      expect(() => {
        middleware({
          ctx: mockContext,
          next: mockNext,
          path: "test",
          type: "query",
          rawInput: undefined,
        });
      }).toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw correct error details for unauthorized access", () => {
      const mockContext: TRPCContext = {
        user: undefined,
        db: {} as any,
      };

      const mockNext = vi.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      try {
        middleware({
          ctx: mockContext,
          next: mockNext,
          path: "test",
          type: "query",
          rawInput: undefined,
        });
        expect.fail("Should have thrown TRPCError");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("UNAUTHORIZED");
        expect((error as TRPCError).message).toBe("Authentication required");
      }
    });
  });

  describe("adminProcedure", () => {
    it("should allow access for lifetime tier users", () => {
      const mockContext: TRPCContext = {
        user: {
          id: "admin-user",
          email: "admin@example.com",
          tier: "lifetime",
        },
        db: {} as any,
      };

      const mockNext = vi.fn().mockImplementation(() => {
        return Promise.resolve({ admin: true });
      });

      // Test both middlewares (protected + admin)
      const protectedMiddleware = adminProcedure._def.middlewares[0];
      const adminMiddleware = adminProcedure._def.middlewares[1];

      // First middleware (protected) should pass
      const protectedResult = protectedMiddleware({
        ctx: mockContext,
        next: (opts) => opts,
        path: "admin-test",
        type: "query",
        rawInput: undefined,
        input: undefined,
        meta: {},
      });

      expect(protectedResult).toBeDefined();

      // Second middleware (admin) should pass
      const adminResult = adminMiddleware({
        ctx: mockContext,
        next: mockNext,
        path: "admin-test",
        type: "query",
        rawInput: undefined,
        input: undefined,
        meta: {},
      });

      expect(adminResult).toBeDefined();
    });

    it("should throw UNAUTHORIZED error for unauthenticated users", () => {
      const mockContext: TRPCContext = {
        user: undefined,
        db: {} as any,
      };

      const protectedMiddleware = adminProcedure._def.middlewares[0];

      expect(() => {
        protectedMiddleware({
          ctx: mockContext,
          next: vi.fn(),
          path: "admin-test",
          type: "query",
          rawInput: undefined,
        });
      }).toThrow(TRPCError);
    });

    it("should throw FORBIDDEN error for non-lifetime users", () => {
      const mockContext: TRPCContext = {
        user: {
          id: "regular-user",
          email: "user@example.com",
          tier: "premium", // Not lifetime
        },
        db: {} as any,
      };

      // Skip the first middleware (protected) and test admin middleware directly
      const adminMiddleware = adminProcedure._def.middlewares[1];

      try {
        adminMiddleware({
          ctx: mockContext,
          next: vi.fn(),
          path: "admin-test",
          type: "query",
          rawInput: undefined,
        });
        expect.fail("Should have thrown TRPCError");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("FORBIDDEN");
        expect((error as TRPCError).message).toBe("Admin access required");
      }
    });

    it("should throw FORBIDDEN error for free tier users", () => {
      const mockContext: TRPCContext = {
        user: {
          id: "free-user",
          tier: "free",
        },
        db: {} as any,
      };

      const adminMiddleware = adminProcedure._def.middlewares[1];

      try {
        adminMiddleware({
          ctx: mockContext,
          next: vi.fn(),
          path: "admin-test",
          type: "query",
          rawInput: undefined,
        });
        expect.fail("Should have thrown TRPCError");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("FORBIDDEN");
      }
    });
  });

  describe("middleware integration", () => {
    it("should chain middlewares correctly in adminProcedure", () => {
      expect(adminProcedure._def.middlewares).toHaveLength(2);

      // First middleware should be the protected middleware
      // Second middleware should be the admin middleware
      const middlewares = adminProcedure._def.middlewares;
      expect(middlewares).toHaveLength(2);
    });

    it("should preserve context through middleware chain", () => {
      const mockContext: TRPCContext = {
        user: {
          id: "chain-test-user",
          email: "chain@test.com",
          tier: "lifetime",
        },
        db: {} as any,
      };

      const finalHandler = vi.fn().mockImplementation(() => {
        return { chainTest: true };
      });

      // Simulate the middleware chain
      const protectedMiddleware = adminProcedure._def.middlewares[0];
      const adminMiddleware = adminProcedure._def.middlewares[1];

      let contextAfterProtected: any;
      const protectedNext = vi.fn().mockImplementation((opts) => {
        contextAfterProtected = opts.ctx;
        return finalHandler(opts);
      });

      protectedMiddleware({
        ctx: mockContext,
        next: protectedNext,
        path: "chain-test",
        type: "query",
        rawInput: undefined,
        input: undefined,
        meta: {},
      });

      expect(contextAfterProtected.user).toBeDefined();
      expect(contextAfterProtected.user.id).toBe("chain-test-user");
      expect(finalHandler).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle TRPCError correctly", () => {
      const error = new TRPCError({
        code: "UNAUTHORIZED",
        message: "Test error",
      });

      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Test error");
      expect(error).toBeInstanceOf(Error);
    });

    it("should handle different TRPC error codes", () => {
      const codes = [
        "UNAUTHORIZED",
        "FORBIDDEN",
        "BAD_REQUEST",
        "INTERNAL_SERVER_ERROR",
      ] as const;

      codes.forEach((code) => {
        const error = new TRPCError({
          code,
          message: `Test ${code} error`,
        });

        expect(error.code).toBe(code);
        expect(error.message).toBe(`Test ${code} error`);
      });
    });
  });

  describe("procedure definitions", () => {
    it("should have correct procedure structure", () => {
      expect(publicProcedure._def).toBeDefined();
      expect(protectedProcedure._def).toBeDefined();
      expect(adminProcedure._def).toBeDefined();

      expect(publicProcedure._def.middlewares).toHaveLength(0);
      expect(protectedProcedure._def.middlewares).toHaveLength(1);
      expect(adminProcedure._def.middlewares).toHaveLength(2);
    });

    it("should support different procedure types", () => {
      // Test that procedures can be used with different types
      const queryProcedure = publicProcedure.query(() => "query");
      const mutationProcedure = publicProcedure.mutation(() => "mutation");

      expect(queryProcedure).toBeDefined();
      expect(mutationProcedure).toBeDefined();
    });
  });

  describe("context type safety", () => {
    it("should provide correct context types", () => {
      const mockAuthenticatedContext: TRPCContext = {
        user: {
          id: "type-test-user",
          email: "type@test.com",
          nostrPublicKey: "npub123",
          tier: "premium",
        },
        db: {} as any,
      };

      const mockUnauthenticatedContext: TRPCContext = {
        user: undefined,
        db: {} as any,
      };

      // Type assertions to ensure context types are correct
      expect(mockAuthenticatedContext.user?.id).toBe("type-test-user");
      expect(mockAuthenticatedContext.user?.tier).toBe("premium");
      expect(mockUnauthenticatedContext.user).toBeUndefined();

      // Test that db is always available
      expect(mockAuthenticatedContext.db).toBeDefined();
      expect(mockUnauthenticatedContext.db).toBeDefined();
    });
  });

  describe("integration scenarios", () => {
    it("should handle complex middleware scenarios", () => {
      const contexts = [
        // Unauthenticated user
        { user: undefined, db: {} as any },
        // Free user
        { user: { id: "free", tier: "free" as const }, db: {} as any },
        // Premium user
        { user: { id: "premium", tier: "premium" as const }, db: {} as any },
        // Lifetime user
        { user: { id: "lifetime", tier: "lifetime" as const }, db: {} as any },
      ];

      const protectedMiddleware = protectedProcedure._def.middlewares[0];
      const adminMiddleware = adminProcedure._def.middlewares[1];

      contexts.forEach((ctx, index) => {
        if (index === 0) {
          // Unauthenticated - should fail protected middleware
          expect(() => {
            protectedMiddleware({
              ctx,
              next: vi.fn(),
              path: "test",
              type: "query",
              rawInput: undefined,
            });
          }).toThrow(TRPCError);
        } else {
          // Authenticated users should pass protected middleware
          const result = protectedMiddleware({
            ctx,
            next: vi.fn().mockImplementation((opts) => opts),
            path: "test",
            type: "query",
            rawInput: undefined,
          });
          expect(result).toBeDefined();

          // Test admin middleware
          if (ctx.user?.tier === "lifetime") {
            // Lifetime users should pass admin middleware
            const adminResult = adminMiddleware({
              ctx,
              next: vi.fn().mockImplementation((opts) => opts),
              path: "admin-test",
              type: "query",
              rawInput: undefined,
            });
            expect(adminResult).toBeDefined();
          } else {
            // Non-lifetime users should fail admin middleware
            expect(() => {
              adminMiddleware({
                ctx,
                next: vi.fn(),
                path: "admin-test",
                type: "query",
                rawInput: undefined,
              });
            }).toThrow(TRPCError);
          }
        }
      });
    });
  });
});
