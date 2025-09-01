import type { PricingTier } from "@deadmansswitch/database";

/**
 * Generate dynamic features list based on tier configuration
 * This ensures consistent feature display across all components
 */
export function generateTierFeatures(tier: PricingTier): string[] {
  const features: string[] = [];

  if (tier.name === "free") {
    features.push(
      `Up to ${tier.maxEmails} emails`,
      `${tier.maxRecipients} recipients per email`,
      `${tier.maxSubjectLength} character subject line`,
      `${tier.maxContentLength.toLocaleString()} character content`,
      "Basic scheduling",
      "Nostr encryption",
      "Single relay storage (basic)"
    );
  } else if (tier.name === "premium") {
    features.push(
      `Up to ${tier.maxEmails} emails`,
      `${tier.maxRecipients} recipients per email`,
      `${tier.maxSubjectLength} character subject line`,
      `${tier.maxContentLength.toLocaleString()} character content`,
      "Advanced scheduling",
      "Nostr encryption",
      `Multi-relay storage (up to ${tier.maxRelays} relays)`,
      "Enhanced decentralization",
      "10% off with Bitcoin Lightning",
      "7% off with stablecoins",
      "Priority support"
    );
  } else if (tier.name === "lifetime") {
    features.push(
      `Up to ${tier.maxEmails} emails`,
      `${tier.maxRecipients} recipients per email`,
      "One-time payment",
      "Lifetime updates",
      `Multi-relay storage (up to ${tier.maxRelays} relays)`,
      "Optimized decentralization",
      "10% off with Bitcoin Lightning",
      "7% off with stablecoins",
      "Priority support"
    );
  }

  return features;
}
