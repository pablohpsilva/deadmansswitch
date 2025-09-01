// Export types from database package
export type {
  PricingTier,
  PaymentMethod,
  PricingConfiguration,
  NewPricingTier,
  NewPaymentMethod,
  NewPricingConfiguration,
} from "@deadmansswitch/database";

// Frontend-specific pricing types
export interface PricingTierWithFeatures {
  name: string;
  interval: string;
  features: string[];
  maxEmails: number;
  maxRecipients: number;
  maxSubjectLength: number;
  maxContentLength: number;
  maxRelays: number;
  paymentMethods?: PaymentMethodWithPricing[];
}

export interface PaymentMethodWithPricing {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  requiresKyc: boolean;
  includesTax: boolean;
  basePrice: string;
  discountPercent: number;
  finalPrice: string;
  currency: string;
  interval?: string;
  benefits: string[];
}

export interface PricingData {
  [tierName: string]: PricingTierWithFeatures;
}

// Payment method names enum
export enum PaymentMethodName {
  STRIPE = "stripe",
  LIGHTNING = "lightning",
  STABLECOIN = "stablecoin",
}

// Supported crypto units
export enum CryptoUnit {
  SATS = "sats",
  USD = "USD",
  USDT = "USDT",
  USDC = "USDC",
}
