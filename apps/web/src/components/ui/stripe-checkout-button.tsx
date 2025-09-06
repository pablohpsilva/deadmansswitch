"use client";

import { useState } from "react";
import { Button } from "./card";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Loader2, CreditCard } from "lucide-react";

interface StripeCheckoutButtonProps {
  tier: "premium" | "lifetime";
  children?: React.ReactNode;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function StripeCheckoutButton({
  tier,
  children,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
}: StripeCheckoutButtonProps) {
  const { handlePremiumCheckout, handleLifetimeCheckout, isLoading, error } =
    useStripeCheckout();

  const handleClick = () => {
    if (tier === "premium") {
      handlePremiumCheckout();
    } else {
      handleLifetimeCheckout();
    }
  };

  const buttonText =
    children || `Upgrade to ${tier === "premium" ? "Premium" : "Lifetime"}`;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={className}
        size={size}
        variant={variant}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>{buttonText}</span>
          </div>
        )}
      </Button>

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
