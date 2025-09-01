import { describe, it, expect } from "vitest";
import { paymentsRouter } from "./payments";

describe("Payments Router", () => {
  it("should export paymentsRouter with expected procedures", () => {
    expect(paymentsRouter).toBeDefined();
    expect(paymentsRouter.getPricing).toBeDefined();
    expect(paymentsRouter.getSubscription).toBeDefined();
    expect(paymentsRouter.createPremiumCheckout).toBeDefined();
    expect(paymentsRouter.createLifetimeCheckout).toBeDefined();
    expect(paymentsRouter.cancelSubscription).toBeDefined();
    expect(paymentsRouter.reactivateSubscription).toBeDefined();
    expect(paymentsRouter.handleWebhook).toBeDefined();
    expect(paymentsRouter.createLightningPremiumInvoice).toBeDefined();
    expect(paymentsRouter.createLightningLifetimeInvoice).toBeDefined();
    expect(paymentsRouter.verifyLightningPayment).toBeDefined();
    expect(paymentsRouter.getLightningPaymentStatus).toBeDefined();
  });

  it("should have proper procedure types", () => {
    expect(paymentsRouter.getPricing).toBeDefined();
    expect(paymentsRouter.getSubscription).toBeDefined();
    expect(paymentsRouter.createPremiumCheckout).toBeDefined();
    expect(paymentsRouter.createLifetimeCheckout).toBeDefined();
    expect(paymentsRouter.cancelSubscription).toBeDefined();
    expect(paymentsRouter.reactivateSubscription).toBeDefined();
    expect(paymentsRouter.handleWebhook).toBeDefined();
    expect(paymentsRouter.createLightningPremiumInvoice).toBeDefined();
    expect(paymentsRouter.createLightningLifetimeInvoice).toBeDefined();
    expect(paymentsRouter.verifyLightningPayment).toBeDefined();
    expect(paymentsRouter.getLightningPaymentStatus).toBeDefined();
  });
});
