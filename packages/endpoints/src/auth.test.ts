import { describe, it, expect, vi } from "vitest";
import { authRouter } from "./auth";

describe("Auth Router", () => {
  it("should export authRouter with expected procedures", () => {
    expect(authRouter).toBeDefined();
    expect(authRouter.requestEmailAuth).toBeDefined();
    expect(authRouter.loginWithEmail).toBeDefined();
    expect(authRouter.loginWithNostr).toBeDefined();
    expect(authRouter.checkIn).toBeDefined();
    expect(authRouter.exportNostrKeys).toBeDefined();
    expect(authRouter.me).toBeDefined();
  });

  it("should have proper procedure types", () => {
    expect(authRouter.requestEmailAuth).toBeDefined();
    expect(authRouter.loginWithEmail).toBeDefined();
    expect(authRouter.loginWithNostr).toBeDefined();
    expect(authRouter.checkIn).toBeDefined();
    expect(authRouter.exportNostrKeys).toBeDefined();
    expect(authRouter.me).toBeDefined();
  });
});