"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./card";
import {
  Check,
  Zap,
  Shield,
  CreditCard,
  Coins,
  ArrowLeft,
  Star,
  ChevronDown,
} from "lucide-react";
import {
  PaymentMethod,
  StablecoinToken,
  StablecoinNetwork,
  Tier,
} from "./pricing-wizard";

interface PurchaseViewProps {
  selectedTier: Tier;
  pricingData: {
    name: string;
    interval: string;
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
  };
  allPlans: {
    free: {
      name: string;
      price: number;
      features: string[];
      maxEmails: number;
      maxRecipients: number;
      maxRelays: number;
    };
    premium?: any;
    lifetime?: any;
  };
  onBack: () => void;
  onComplete: (
    method: PaymentMethod,
    details?: { token?: StablecoinToken; network?: StablecoinNetwork }
  ) => void;
  isLoading?: boolean;
  className?: string;
}

export function PurchaseView({
  selectedTier,
  pricingData,
  allPlans,
  onBack,
  onComplete,
  isLoading = false,
  className = "",
}: PurchaseViewProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [selectedToken, setSelectedToken] = useState<StablecoinToken>("USDT");
  const [selectedNetwork, setSelectedNetwork] =
    useState<StablecoinNetwork>("Ethereum");

  const getMethodDisplayName = (method: PaymentMethod) => {
    switch (method) {
      case "stripe":
        return "Credit Card";
      case "lightning":
        return "Bitcoin Lightning";
      case "stablecoin":
        return `${selectedToken} (${selectedNetwork})`;
    }
  };

  const handleComplete = () => {
    if (!selectedMethod) return;

    const details =
      selectedMethod === "stablecoin"
        ? { token: selectedToken, network: selectedNetwork }
        : undefined;

    onComplete(selectedMethod, details);
  };

  const getLowestPrice = () => {
    const prices = [
      pricingData.paymentMethods.lightning.price,
      pricingData.paymentMethods.stablecoin.price,
    ];
    return Math.min(...prices);
  };

  const getHighestDiscount = () => {
    const discounts = [
      pricingData.paymentMethods.lightning.discount,
      pricingData.paymentMethods.stablecoin.discount,
    ];
    return Math.max(...discounts);
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-300 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="font-medium">Back to Plans</span>
        </button>
        <div className="text-sm text-gray-500">Step 2 of 2</div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Selected Plan Details */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl border-2 border-blue-500 p-6 sticky top-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                  Selected Plan
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-1">
                {pricingData.name}
              </h2>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-3xl font-bold text-blue-600">
                  From ${getLowestPrice()}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  ${pricingData.paymentMethods.stripe.price}
                </span>
              </div>
              <div className="text-sm text-green-600 font-medium">
                Save up to {getHighestDiscount()}% with crypto
              </div>
              <div className="text-sm text-gray-300 mt-1">
                /{pricingData.interval}
              </div>
            </div>

            {/* Plan Features */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-100 mb-3">
                What's included:
              </h3>
              <ul className="space-y-2">
                {pricingData.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Plan Comparison Button - Scroll to Feature Comparison */}
            <button
              onClick={() => {
                const element = document.getElementById("feature-comparison");
                if (element) {
                  element.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }}
              className="w-full flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-medium text-gray-200 mr-2">
                Compare with other plans
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Right Column - Payment Options */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-100 mb-2">
                Choose Your Payment Method
              </h2>
              <p className="text-gray-300">
                Select how you'd like to pay for your {pricingData.name} plan
              </p>
            </div>

            {/* Payment Method Options */}
            <div className="space-y-4 mb-6">
              {/* Stripe */}
              <PaymentMethodCard
                icon={CreditCard}
                title="Credit/Debit Card"
                subtitle="Pay with any major credit card"
                price={pricingData.paymentMethods.stripe.price}
                originalPrice={pricingData.paymentMethods.stripe.price}
                discount={0}
                features={[
                  "Instant activation",
                  "Familiar process",
                  "Buyer protection",
                ]}
                requirements={["KYC required", "Tax calculated by location"]}
                isSelected={selectedMethod === "stripe"}
                onSelect={() => setSelectedMethod("stripe")}
              />

              {/* Lightning */}
              <PaymentMethodCard
                icon={Zap}
                title="Bitcoin Lightning Network"
                subtitle="Fast, private Bitcoin payments"
                price={pricingData.paymentMethods.lightning.price}
                originalPrice={pricingData.paymentMethods.stripe.price}
                discount={pricingData.paymentMethods.lightning.discount}
                badge="10% OFF"
                badgeColor="bg-orange-500"
                features={[
                  "10% discount",
                  "Complete privacy",
                  "No taxes",
                  "Instant settlement",
                ]}
                cryptoAmount={pricingData.paymentMethods.lightning.satsAmount}
                cryptoUnit="sats"
                isSelected={selectedMethod === "lightning"}
                onSelect={() => setSelectedMethod("lightning")}
              />

              {/* Stablecoin */}
              <PaymentMethodCard
                icon={Coins}
                title="Stablecoins (USDT/USDC)"
                subtitle="Pay with stablecoins on multiple networks"
                price={pricingData.paymentMethods.stablecoin.price}
                originalPrice={pricingData.paymentMethods.stripe.price}
                discount={pricingData.paymentMethods.stablecoin.discount}
                badge="7% OFF"
                badgeColor="bg-green-500"
                features={[
                  "7% discount",
                  "No personal info required",
                  "No taxes",
                  "Multiple networks",
                ]}
                isSelected={selectedMethod === "stablecoin"}
                onSelect={() => setSelectedMethod("stablecoin")}
              />
            </div>

            {/* Stablecoin Details */}
            {selectedMethod === "stablecoin" && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg border">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-100 mb-3">
                      Choose Token
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {pricingData.paymentMethods.stablecoin.acceptedTokens.map(
                        (token) => (
                          <button
                            key={token}
                            onClick={() =>
                              setSelectedToken(token as StablecoinToken)
                            }
                            className={cn(
                              "p-2 rounded-lg border-2 text-center font-medium transition-colors text-sm",
                              selectedToken === token
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-600"
                            )}
                          >
                            {token}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-100 mb-3">
                      Choose Network
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {pricingData.paymentMethods.stablecoin.networks.map(
                        (network) => (
                          <button
                            key={network}
                            onClick={() =>
                              setSelectedNetwork(network as StablecoinNetwork)
                            }
                            className={cn(
                              "p-2 rounded-lg border-2 text-center font-medium transition-colors text-sm",
                              selectedNetwork === network
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-600"
                            )}
                          >
                            {network}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            {selectedMethod && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-100 mb-3">
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Plan:</span>
                    <span className="font-medium">{pricingData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Payment Method:</span>
                    <span className="font-medium">
                      {getMethodDisplayName(selectedMethod)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-gray-300">Total:</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-100">
                        ${pricingData.paymentMethods[selectedMethod].price}
                      </span>
                      {pricingData.paymentMethods[selectedMethod].discount >
                        0 && (
                        <div className="text-xs text-green-600">
                          {pricingData.paymentMethods[selectedMethod].discount}%
                          savings
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Back to Plans
              </Button>
              <Button
                onClick={handleComplete}
                variant="primary"
                disabled={!selectedMethod || isLoading}
                loading={isLoading}
                className="flex-1"
              >
                {selectedMethod === "stripe" && "Pay with Card"}
                {selectedMethod === "lightning" && "Pay with Bitcoin"}
                {selectedMethod === "stablecoin" && `Pay with ${selectedToken}`}
              </Button>
            </div>

            {/* Security Notice */}
            <div className="mt-4 flex items-start space-x-2 p-3 bg-gray-700 rounded-lg">
              <Shield className="h-4 w-4 text-gray-300 mt-0.5" />
              <div className="text-sm text-gray-300">
                <span className="font-medium">Secure Payment:</span> All
                transactions are processed with bank-level security and
                end-to-end encryption.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Comparison Modal/Section */}
      {false && (
        <div className="mt-6 bg-gray-800 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-100 mb-4">
            Plan Comparison
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(allPlans).map(([key, plan]) => {
              if (!plan || key === "free") return null;
              const isSelected = key === selectedTier;

              return (
                <div
                  key={key}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-colors",
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-600"
                  )}
                >
                  <div className="text-center mb-3">
                    <h4 className="font-semibold text-gray-100 capitalize">
                      {plan.name}
                    </h4>
                    <div className="text-lg font-bold text-gray-100">
                      {plan.paymentMethods
                        ? `From $${Math.min(
                            plan.paymentMethods.lightning.price,
                            plan.paymentMethods.stablecoin.price
                          )}`
                        : `$${plan.price || 0}`}
                    </div>
                    {isSelected && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {/* Show key comparison metrics */}
                    <li className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-1" />
                        Nostr Relays
                      </span>
                      <span className="font-semibold">
                        {plan.maxRelays === -1
                          ? "Unlimited"
                          : plan.maxRelays || "—"}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-1" />
                        Max Emails
                      </span>
                      <span className="font-semibold">
                        {plan.maxEmails === -1
                          ? "Unlimited"
                          : plan.maxEmails || "—"}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-1" />
                        Recipients
                      </span>
                      <span className="font-semibold">
                        {plan.maxRecipients === -1
                          ? "Unlimited"
                          : plan.maxRecipients || "—"}
                      </span>
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for payment method cards
function PaymentMethodCard({
  icon: Icon,
  title,
  subtitle,
  price,
  originalPrice,
  discount,
  badge,
  badgeColor,
  features,
  requirements,
  cryptoAmount,
  cryptoUnit,
  isSelected,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  discount: number;
  badge?: string;
  badgeColor?: string;
  features: string[];
  requirements?: string[];
  cryptoAmount?: number;
  cryptoUnit?: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-600 hover:bg-gray-700"
      )}
    >
      {badge && (
        <div className="absolute -top-2 -right-2">
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-bold text-white",
              badgeColor
            )}
          >
            {badge}
          </span>
        </div>
      )}

      <div className="flex items-start space-x-4">
        <div
          className={cn(
            "p-2 rounded-lg flex-shrink-0",
            isSelected ? "bg-blue-100" : "bg-gray-700"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              isSelected ? "text-blue-600" : "text-gray-300"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-100">{title}</h3>
              <p className="text-sm text-gray-300">{subtitle}</p>
            </div>
            <div className="text-right ml-4">
              <div className="flex items-center space-x-2">
                {discount > 0 && originalPrice !== price && (
                  <span className="text-sm text-gray-500 line-through">
                    ${originalPrice}
                  </span>
                )}
                <span className="text-lg font-bold text-gray-100">
                  ${price}
                </span>
              </div>
              {cryptoAmount && cryptoUnit && (
                <div className="text-xs text-gray-300">
                  ≈ {cryptoAmount.toLocaleString()} {cryptoUnit}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div>
              <ul className="space-y-1 text-gray-300">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <Check className="h-3 w-3 text-green-500 mr-1" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            {requirements && (
              <div>
                <ul className="space-y-1 text-gray-500">
                  {requirements.map((req, idx) => (
                    <li key={idx} className="flex items-center">
                      <Shield className="h-3 w-3 text-gray-400 mr-1" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
            isSelected ? "border-blue-500 bg-blue-500" : "border-gray-600"
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    </div>
  );
}
