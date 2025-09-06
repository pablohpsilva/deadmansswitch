"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./card";
import { Check, Zap, Shield, CreditCard, Coins } from "lucide-react";

export type PaymentMethod = "stripe" | "lightning" | "stablecoin";
export type StablecoinToken = "USDT" | "USDC";
export type StablecoinNetwork = "Ethereum" | "TRON";

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  discount: number;
  price: number;
  originalPrice?: number;
  benefits: string[];
  requirements?: string[];
  badge?: string;
  badgeColor?: string;
}

interface PaymentMethodSelectorProps {
  tier: "premium" | "lifetime";
  pricing: {
    stripe: {
      price: number;
      discount: number;
      taxIncluded: boolean;
      kycRequired: boolean;
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
  onPaymentMethodSelect: (
    method: PaymentMethod,
    details?: { token?: StablecoinToken; network?: StablecoinNetwork }
  ) => void;
  className?: string;
}

export function PaymentMethodSelector({
  tier,
  pricing,
  onPaymentMethodSelect,
  className = "",
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("stripe");
  const [selectedToken, setSelectedToken] = useState<StablecoinToken>("USDT");
  const [selectedNetwork, setSelectedNetwork] =
    useState<StablecoinNetwork>("Ethereum");

  const paymentOptions: PaymentMethodOption[] = [
    {
      id: "stripe",
      name: "Credit/Debit Card",
      icon: CreditCard,
      discount: pricing.stripe.discount,
      price: pricing.stripe.price,
      benefits: [
        "Instant activation",
        "Familiar payment process",
        "Buyer protection",
        "All major cards accepted",
      ],
      requirements: ["KYC verification required", "Tax calculated by location"],
    },
    {
      id: "lightning",
      name: "Bitcoin Lightning",
      icon: Zap,
      discount: pricing.lightning.discount,
      price: pricing.lightning.price,
      originalPrice: pricing.stripe.price,
      benefits: [
        "10% discount",
        "No tax fees",
        "Complete privacy",
        "Instant settlement",
        "Decentralized payment",
      ],
      badge: "10% OFF",
      badgeColor: "bg-orange-500",
    },
    {
      id: "stablecoin",
      name: "Stablecoins",
      icon: Coins,
      discount: pricing.stablecoin.discount,
      price: pricing.stablecoin.price,
      originalPrice: pricing.stripe.price,
      benefits: [
        "7% discount",
        "No tax fees",
        "Blockchain transparency",
        "No user info required",
        "USDT & USDC supported",
      ],
      badge: "7% OFF",
      badgeColor: "bg-green-500",
    },
  ];

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);

    if (method === "stablecoin") {
      // For stablecoins, pass the selected token and network
      onPaymentMethodSelect(method, {
        token: selectedToken,
        network: selectedNetwork,
      });
    } else {
      onPaymentMethodSelect(method);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-100 mb-2">
          Choose Your Payment Method
        </h3>
        <p className="text-sm text-gray-300">
          Select how you'd like to pay for your {tier} plan
        </p>
      </div>

      <div className="grid gap-4">
        {paymentOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedMethod === option.id;

          return (
            <div
              key={option.id}
              className={cn(
                "relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200",
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-600 hover:bg-gray-700"
              )}
              onClick={() => handleMethodSelect(option.id)}
            >
              {option.badge && (
                <div className="absolute -top-2 -right-2">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold text-white",
                      option.badgeColor
                    )}
                  >
                    {option.badge}
                  </span>
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div
                  className={cn(
                    "flex-shrink-0 p-2 rounded-lg",
                    isSelected ? "bg-blue-100" : "bg-gray-700"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6",
                      isSelected ? "text-blue-600" : "text-gray-300"
                    )}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-100">
                      {option.name}
                    </h4>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {option.originalPrice &&
                          option.originalPrice !== option.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${option.originalPrice}
                            </span>
                          )}
                        <span className="text-lg font-bold text-gray-100">
                          ${option.price}
                        </span>
                      </div>
                      {option.discount > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          Save $
                          {((option.originalPrice || 0) - option.price).toFixed(
                            2
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <h5 className="text-xs font-medium text-gray-200 mb-1">
                        Benefits
                      </h5>
                      <ul className="space-y-1">
                        {option.benefits.map((benefit, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-1.5 text-xs text-gray-300"
                          >
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {option.requirements && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-200 mb-1">
                          Requirements
                        </h5>
                        <ul className="space-y-1">
                          {option.requirements.map((req, index) => (
                            <li
                              key={index}
                              className="flex items-center space-x-1.5 text-xs text-gray-500"
                            >
                              <Shield className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Stablecoin specific options */}
                  {option.id === "stablecoin" && isSelected && (
                    <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-200 mb-2">
                            Token
                          </label>
                          <div className="space-y-2">
                            {pricing.stablecoin.acceptedTokens.map((token) => (
                              <label
                                key={token}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="radio"
                                  value={token}
                                  checked={selectedToken === token}
                                  onChange={(e) =>
                                    setSelectedToken(
                                      e.target.value as StablecoinToken
                                    )
                                  }
                                  className="text-blue-600"
                                />
                                <span className="text-sm text-gray-200">
                                  {token}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-200 mb-2">
                            Network
                          </label>
                          <div className="space-y-2">
                            {pricing.stablecoin.networks.map((network) => (
                              <label
                                key={network}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="radio"
                                  value={network}
                                  checked={selectedNetwork === network}
                                  onChange={(e) =>
                                    setSelectedNetwork(
                                      e.target.value as StablecoinNetwork
                                    )
                                  }
                                  className="text-blue-600"
                                />
                                <span className="text-sm text-gray-200">
                                  {network}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lightning specific info */}
                  {option.id === "lightning" && isSelected && (
                    <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-800">
                          ≈ {pricing.lightning.satsAmount.toLocaleString()} sats
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-600"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-100 mb-2">
          Payment Security
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-300">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>End-to-end encryption</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Secure payment processing</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>No payment data stored</span>
          </div>
        </div>
      </div>
    </div>
  );
}
