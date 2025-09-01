"use client";

import { ReactNode, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Button } from "./card";
import {
  PaymentMethodSelector,
  PaymentMethod,
  StablecoinToken,
  StablecoinNetwork,
} from "./payment-method-selector";

interface EnhancedPricingCardProps {
  name: string;
  description: string;
  features: string[];
  paymentMethods: {
    stripe: {
      price: number;
      discount: number;
      taxIncluded: boolean;
      kycRequired: boolean;
      priceId?: string;
    };
    lightning: {
      price: number;
      discount: number;
      taxIncluded: boolean;
      kycRequired: boolean;
      satsAmount: number;
    };
    stablecoin: {
      price: number;
      discount: number;
      taxIncluded: boolean;
      kycRequired: boolean;
      acceptedTokens: string[];
      networks: string[];
    };
  };
  interval: string;
  onUpgrade: (
    method: PaymentMethod,
    details?: { token?: StablecoinToken; network?: StablecoinNetwork }
  ) => void;
  popular?: boolean;
  currentPlan?: boolean;
  disabled?: boolean;
  loading?: boolean;
  tier: "premium" | "lifetime";
}

export function EnhancedPricingCard({
  name,
  description,
  features,
  paymentMethods,
  interval,
  onUpgrade,
  popular = false,
  currentPlan = false,
  disabled = false,
  loading = false,
  tier,
}: EnhancedPricingCardProps) {
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("stripe");
  const [selectedDetails, setSelectedDetails] = useState<{
    token?: StablecoinToken;
    network?: StablecoinNetwork;
  }>();

  const handlePaymentMethodSelect = (
    method: PaymentMethod,
    details?: { token?: StablecoinToken; network?: StablecoinNetwork }
  ) => {
    setSelectedMethod(method);
    setSelectedDetails(details);
  };

  const handleUpgrade = () => {
    if (showPaymentMethods) {
      onUpgrade(selectedMethod, selectedDetails);
    } else {
      setShowPaymentMethods(true);
    }
  };

  const getDisplayPrice = () => {
    const stripe = paymentMethods.stripe.price;
    const lightning = paymentMethods.lightning.price;
    const stablecoin = paymentMethods.stablecoin.price;

    return {
      from: Math.min(lightning, stablecoin),
      to: stripe,
      original: stripe,
    };
  };

  const displayPrice = getDisplayPrice();

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl border-2 transition-all duration-300",
        popular ? "border-blue-500 shadow-lg" : "border-gray-200",
        "hover:shadow-lg",
        showPaymentMethods ? "p-6" : "p-8"
      )}
    >
      {popular && !showPaymentMethods && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      {currentPlan && !showPaymentMethods && (
        <div className="absolute top-4 right-4">
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
            CURRENT
          </span>
        </div>
      )}

      {!showPaymentMethods ? (
        <>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
            <div className="mb-3">
              {displayPrice.from < displayPrice.to ? (
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-bold text-green-600">
                    From ${displayPrice.from}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    ${displayPrice.to}
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-bold text-gray-900">
                  ${displayPrice.original}
                </span>
              )}
              <span className="text-gray-600 ml-2">/{interval}</span>
            </div>
            <p className="text-gray-600">{description}</p>
          </div>

          {displayPrice.from < displayPrice.to && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-orange-700">
                    Up to 10% off with Bitcoin
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700">
                    7% off with stablecoins
                  </span>
                </div>
              </div>
            </div>
          )}

          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={handleUpgrade}
            variant={popular ? "primary" : "outline"}
            disabled={disabled}
            loading={loading}
            className="w-full"
          >
            {currentPlan ? "Current Plan" : `Choose Payment Method`}
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{name} Plan</h3>
            <button
              onClick={() => setShowPaymentMethods(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <PaymentMethodSelector
            tier={tier}
            pricing={paymentMethods}
            onPaymentMethodSelect={handlePaymentMethodSelect}
            className="mb-6"
          />

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowPaymentMethods(false)}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleUpgrade}
              variant="primary"
              loading={loading}
              className="flex-1"
            >
              {selectedMethod === "stripe" && "Pay with Card"}
              {selectedMethod === "lightning" && "Pay with Bitcoin"}
              {selectedMethod === "stablecoin" &&
                `Pay with ${selectedDetails?.token || "Stablecoin"}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// Legacy PricingCard for compatibility (updated to show payment method hints)
interface PricingCardProps {
  name: string;
  price: string | number;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  onUpgrade: () => void;
  popular?: boolean;
  currentPlan?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  buttonText,
  onUpgrade,
  popular = false,
  currentPlan = false,
  disabled = false,
  loading = false,
}: PricingCardProps) {
  const formatPrice = (p: string | number) => {
    if (typeof p === "number") return `$${p}`;
    return p;
  };

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl border-2 p-8 transition-all duration-300",
        popular ? "border-blue-500 shadow-lg" : "border-gray-200",
        "hover:shadow-lg"
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      {currentPlan && (
        <div className="absolute top-4 right-4">
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
            CURRENT
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
        <div className="mb-3">
          <span className="text-4xl font-bold text-gray-900">
            {formatPrice(price)}
          </span>
          {period && <span className="text-gray-600 ml-2">{period}</span>}
        </div>
        <p className="text-gray-600">{description}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onUpgrade}
        variant={popular ? "primary" : "outline"}
        disabled={disabled}
        loading={loading}
        className="w-full"
      >
        {buttonText}
      </Button>
    </div>
  );
}
