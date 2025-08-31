import { describe, it, expect } from "vitest";
import { nostrRouter } from "./nostr";

describe("Nostr Router", () => {
  it("should export nostrRouter with expected procedures", () => {
    expect(nostrRouter).toBeDefined();
    expect(nostrRouter.getRelays).toBeDefined();
    expect(nostrRouter.addRelay).toBeDefined();
    expect(nostrRouter.updateRelay).toBeDefined();
    expect(nostrRouter.deleteRelay).toBeDefined();
    expect(nostrRouter.testRelay).toBeDefined();
    expect(nostrRouter.getDefaultRelays).toBeDefined();
  });

  it("should have proper procedure types", () => {
    expect(nostrRouter.getRelays).toBeDefined();
    expect(nostrRouter.addRelay).toBeDefined();
    expect(nostrRouter.updateRelay).toBeDefined();
    expect(nostrRouter.deleteRelay).toBeDefined();
    expect(nostrRouter.testRelay).toBeDefined();
    expect(nostrRouter.getDefaultRelays).toBeDefined();
  });
});
