/**
 * Shared types between frontend and backend
 * This file provides type definitions that can be safely imported by both apps
 */

// Define the AppRouter interface to avoid import issues with backend compilation
// This mirrors the backend router structure without importing the actual backend code
export interface AppRouter {
  auth: {
    requestEmailAuth: any;
    loginWithEmail: any;
    loginWithNostr: any;
    checkIn: any;
    exportNostrKeys: any;
    me: any;
  };
  emails: {
    getTierLimits: any;
    getEmails: any;
    getEmail: any;
    createEmail: any;
    updateEmail: any;
    deleteEmail: any;
    previewEmail: any;
  };
  nostr: {
    getRelays: any;
    addRelay: any;
    removeRelay: any;
    testRelay: any;
    validateRelayUrl: any;
  };
  payments: {
    getSubscription: any;
    createPremiumCheckout: any;
    createLifetimeCheckout: any;
    cancelSubscription: any;
    reactivateSubscription: any;
    handleStripeWebhook: any;
    createLightningPremiumInvoice: any;
    createLightningLifetimeInvoice: any;
    verifyLightningPayment: any;
    getLightningPaymentStatus: any;
    getAuditLogs: any;
  };
}
