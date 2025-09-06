"use client";

import { StripeCheckoutButton } from "@/components/ui/stripe-checkout-button";

interface StripeCheckoutSectionProps {
  tier: "premium" | "lifetime";
  className?: string;
  children?: React.ReactNode;
}

export function StripeCheckoutSection({
  tier,
  className = "",
  children,
}: StripeCheckoutSectionProps) {
  return (
    <div className={className}>
      <StripeCheckoutButton tier={tier}>{children}</StripeCheckoutButton>
    </div>
  );
}
