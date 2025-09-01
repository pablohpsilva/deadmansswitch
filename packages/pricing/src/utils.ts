import type { PaymentMethodWithPricing } from "./types";

/**
 * Calculate final price with discount applied
 */
export function calculateFinalPrice(
  basePrice: number,
  discountPercent: number
): number {
  const discount = (basePrice * discountPercent) / 100;
  return basePrice - discount;
}

/**
 * Format price for display
 */
export function formatPrice(
  price: number | string,
  currency: string = "USD"
): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numPrice);
  }

  // For crypto currencies, show with appropriate precision
  if (currency === "sats") {
    return `${numPrice.toLocaleString()} sats`;
  }

  return `${numPrice} ${currency}`;
}

/**
 * Get payment method benefits based on discount and features
 */
export function getPaymentMethodBenefits(
  method: PaymentMethodWithPricing
): string[] {
  const benefits: string[] = [];

  if (method.discountPercent > 0) {
    benefits.push(`${method.discountPercent}% discount`);
  }

  if (!method.requiresKyc) {
    benefits.push("No KYC required");
  }

  if (!method.includesTax) {
    benefits.push("No tax");
  }

  // Method-specific benefits
  switch (method.name) {
    case "lightning":
      benefits.push("Instant settlement", "Private payments");
      break;
    case "stablecoin":
      benefits.push("Stable value", "Crypto payments");
      break;
    case "stripe":
      benefits.push("Credit/debit cards", "Trusted payment gateway");
      break;
  }

  return benefits;
}

/**
 * Get the "From" price for tier display (lowest price across payment methods)
 */
export function getFromPrice(
  paymentMethods: PaymentMethodWithPricing[]
): string {
  if (!paymentMethods || paymentMethods.length === 0) {
    return "N/A";
  }

  const lowestPrice = Math.min(
    ...paymentMethods.map((method) => parseFloat(method.finalPrice))
  );

  return formatPrice(lowestPrice);
}
