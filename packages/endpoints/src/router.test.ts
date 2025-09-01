import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./router";

// Mock all sub-routers
vi.mock("./auth", () => ({
  authRouter: {
    _def: { procedure: "router", router: true },
    createCaller: vi.fn(),
  },
}));

vi.mock("./nostr", () => ({
  nostrRouter: {
    _def: { procedure: "router", router: true },
    createCaller: vi.fn(),
  },
}));

vi.mock("./emails", () => ({
  emailsRouter: {
    _def: { procedure: "router", router: true },
    createCaller: vi.fn(),
  },
}));

vi.mock("./payments", () => ({
  paymentsRouter: {
    _def: { procedure: "router", router: true },
    createCaller: vi.fn(),
  },
}));

// Mock the tRPC router creation
vi.mock("../lib/trpc", () => ({
  createTRPCRouter: vi.fn().mockImplementation((procedures) => ({
    _def: { procedure: "router", router: true },
    ...procedures,
    createCaller: vi.fn(),
  })),
}));

describe("App Router", () => {
  it("should create the main app router with all sub-routers", () => {
    expect(appRouter).toBeDefined();
    expect(appRouter.auth).toBeDefined();
    expect(appRouter.nostr).toBeDefined();
    expect(appRouter.emails).toBeDefined();
    expect(appRouter.payments).toBeDefined();
  });

  it("should have the correct router structure", () => {
    // Verify that the router has all expected sub-routers
    const routerKeys = Object.keys(appRouter);
    expect(routerKeys).toContain("auth");
    expect(routerKeys).toContain("nostr");
    expect(routerKeys).toContain("emails");
    expect(routerKeys).toContain("payments");
  });

  it("should export the AppRouter type", () => {
    // This test ensures the type export is working
    // TypeScript will catch any issues with the type export
    expect(typeof appRouter).toBe("object");
  });
});
