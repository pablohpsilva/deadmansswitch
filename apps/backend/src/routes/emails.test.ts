import { describe, it, expect } from "vitest";
import { emailsRouter } from "./emails";

describe("Emails Router", () => {
  it("should export emailsRouter with expected procedures", () => {
    expect(emailsRouter).toBeDefined();
    expect(emailsRouter.getTierLimits).toBeDefined();
    expect(emailsRouter.getEmails).toBeDefined();
    expect(emailsRouter.getEmail).toBeDefined();
    expect(emailsRouter.createEmail).toBeDefined();
    expect(emailsRouter.updateEmail).toBeDefined();
    expect(emailsRouter.deleteEmail).toBeDefined();
    expect(emailsRouter.previewEmail).toBeDefined();
  });

  it("should have proper procedure types", () => {
    expect(emailsRouter.getTierLimits).toBeDefined();
    expect(emailsRouter.getEmails).toBeDefined();
    expect(emailsRouter.getEmail).toBeDefined();
    expect(emailsRouter.createEmail).toBeDefined();
    expect(emailsRouter.updateEmail).toBeDefined();
    expect(emailsRouter.deleteEmail).toBeDefined();
    expect(emailsRouter.previewEmail).toBeDefined();
  });
});
