"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  PricingWizard,
  PaymentMethod,
  StablecoinToken,
  StablecoinNetwork,
  Tier,
} from "./pricing-wizard";
import { EnhancedPricingCard } from "./enhanced-pricing-card";
import { PricingCard } from "./pricing";
import { PurchaseView } from "./purchase-view";

interface PricingData {
  name: string;
  interval: string;
  features: string[];
  paymentMethods?: {
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
}

interface ResponsivePricingProps {
  pricing: {
    free: { name: string; price: number; features: string[] };
    premium: PricingData;
    lifetime: PricingData;
  };
  currentTier: string;
  onUpgrade: (
    tier: Tier,
    method: PaymentMethod,
    details?: { token?: StablecoinToken; network?: StablecoinNetwork }
  ) => void;
  isLoading?: string | null;
  className?: string;
}

export function ResponsivePricing({
  pricing,
  currentTier,
  onUpgrade,
  isLoading = null,
  className = "",
}: ResponsivePricingProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Tier | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleUpgrade = (
    tier: Tier,
    method: PaymentMethod,
    details?: { token?: StablecoinToken; network?: StablecoinNetwork }
  ) => {
    setShowWizard(false);
    setSelectedPlan(null);
    onUpgrade(tier, method, details);
  };

  const handleShowWizard = () => {
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
  };

  const handleSelectPlan = (tier: Tier) => {
    if (isMobile) {
      setShowWizard(true);
    } else {
      setSelectedPlan(tier);
    }
  };

  const handleBackToPlans = () => {
    setSelectedPlan(null);
    setShowWizard(false);
  };

  // Mobile version with wizard
  if (isMobile) {
    return (
      <div className={cn("w-full", className)}>
        {!showWizard ? (
          <div className="space-y-4">
            {/* Mobile Pricing Cards */}
            <div className="space-y-3">
              {/* Free Tier */}
              <div
                className={cn(
                  "p-4 rounded-lg border-2",
                  currentTier === "free"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-100">
                    {pricing.free.name}
                  </h3>
                  <div className="text-xl font-bold text-gray-100">
                    ${pricing.free.price}
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Perfect for getting started
                </p>
                <div className="text-xs text-gray-300">
                  {pricing.free.features.map((feature, idx) => (
                    <div key={idx}>• {feature}</div>
                  ))}
                </div>
                {currentTier === "free" && (
                  <div className="mt-3 text-center">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}
              </div>

              {/* Premium Tier */}
              <div
                className={cn(
                  "relative p-4 rounded-lg border-2",
                  currentTier === "premium"
                    ? "border-green-500 bg-green-50"
                    : "border-blue-500 bg-blue-50"
                )}
              >
                {currentTier === "free" && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-100">
                    {pricing.premium.name}
                  </h3>
                  <div className="text-right">
                    {pricing.premium.paymentMethods && (
                      <>
                        <div className="text-sm text-green-600 font-medium">
                          From $
                          {Math.min(
                            pricing.premium.paymentMethods.lightning.price,
                            pricing.premium.paymentMethods.stablecoin.price
                          )}
                        </div>
                        <div className="text-xs text-gray-500 line-through">
                          ${pricing.premium.paymentMethods.stripe.price}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-3">For serious users</p>

                <div className="text-xs text-gray-300 mb-3">
                  {pricing.premium.features.map((feature, idx) => (
                    <div key={idx}>• {feature}</div>
                  ))}
                </div>

                <div className="flex items-center text-xs text-gray-300 mb-3">
                  <div className="flex items-center mr-4">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                    <span>10% off with Bitcoin</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span>7% off with stablecoins</span>
                  </div>
                </div>

                {currentTier === "premium" ? (
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Current Plan
                    </span>
                  </div>
                ) : currentTier === "free" ? (
                  <button
                    onClick={() => handleSelectPlan("premium")}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Choose Payment Method
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    Not Available
                  </button>
                )}
              </div>

              {/* Lifetime Tier */}
              <div
                className={cn(
                  "p-4 rounded-lg border-2",
                  currentTier === "lifetime"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-100">
                    {pricing.lifetime.name}
                  </h3>
                  <div className="text-right">
                    {pricing.lifetime.paymentMethods && (
                      <>
                        <div className="text-sm text-green-600 font-medium">
                          From $
                          {Math.min(
                            pricing.lifetime.paymentMethods.lightning.price,
                            pricing.lifetime.paymentMethods.stablecoin.price
                          )}
                        </div>
                        <div className="text-xs text-gray-500 line-through">
                          ${pricing.lifetime.paymentMethods.stripe.price}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-3">
                  Pay once, use forever
                </p>

                <div className="text-xs text-gray-300 mb-3">
                  {pricing.lifetime.features.map((feature, idx) => (
                    <div key={idx}>• {feature}</div>
                  ))}
                </div>

                <div className="flex items-center text-xs text-gray-300 mb-3">
                  <div className="flex items-center mr-4">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                    <span>10% off with Bitcoin</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span>7% off with stablecoins</span>
                  </div>
                </div>

                {currentTier === "lifetime" ? (
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Current Plan
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan("lifetime")}
                    disabled={currentTier === "lifetime"}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Get Lifetime Access
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Close button for wizard */}
            <button
              onClick={handleBackToPlans}
              className="absolute top-2 right-2 z-10 p-2 text-gray-500 hover:text-gray-200"
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

            {pricing.premium.paymentMethods &&
              pricing.lifetime.paymentMethods && (
                <PricingWizard
                  premiumData={pricing.premium as any}
                  lifetimeData={pricing.lifetime as any}
                  onComplete={handleUpgrade}
                  isLoading={isLoading !== null}
                />
              )}
          </div>
        )}
      </div>
    );
  }

  // Desktop version - Show either plan selection or purchase view
  return (
    <div className={cn("w-full transition-all duration-300", className)}>
      {selectedPlan && pricing[selectedPlan]?.paymentMethods ? (
        // Show focused purchase view
        <div className="animate-in slide-in-from-right-4 duration-300">
          <PurchaseView
            selectedTier={selectedPlan}
            pricingData={pricing[selectedPlan] as any}
            allPlans={pricing as any}
            onBack={handleBackToPlans}
            onComplete={(method, details) =>
              handleUpgrade(selectedPlan, method, details)
            }
            isLoading={isLoading === selectedPlan}
          />
        </div>
      ) : (
        // Show all plans
        <div className="animate-in fade-in-0 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name={pricing.free.name}
              price={pricing.free.price}
              description="Perfect for getting started"
              features={pricing.free.features}
              buttonText={currentTier === "free" ? "Current Plan" : "Downgrade"}
              onUpgrade={() => {}}
              currentPlan={currentTier === "free"}
              disabled={currentTier === "free"}
            />

            {pricing.premium.paymentMethods && (
              <div className="relative">
                {currentTier === "free" && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <PricingCard
                  name={pricing.premium.name}
                  price={`From $${Math.min(
                    pricing.premium.paymentMethods.lightning.price,
                    pricing.premium.paymentMethods.stablecoin.price
                  )}`}
                  period="/year"
                  description="For serious users"
                  features={[
                    ...pricing.premium.features,
                    "💰 Up to 10% off with crypto payments",
                  ]}
                  buttonText={
                    currentTier === "premium"
                      ? "Current Plan"
                      : currentTier === "free"
                      ? "Choose Payment Method"
                      : "Not Available"
                  }
                  onUpgrade={() => handleSelectPlan("premium")}
                  popular={currentTier === "free"}
                  currentPlan={currentTier === "premium"}
                  disabled={currentTier !== "free"}
                  loading={isLoading === "premium"}
                />
              </div>
            )}

            {pricing.lifetime.paymentMethods && (
              <PricingCard
                name={pricing.lifetime.name}
                price={`From $${Math.min(
                  pricing.lifetime.paymentMethods.lightning.price,
                  pricing.lifetime.paymentMethods.stablecoin.price
                )}`}
                period="one-time"
                description="Pay once, use forever"
                features={[
                  ...pricing.lifetime.features,
                  "💰 Up to 10% off with crypto payments",
                ]}
                buttonText={
                  currentTier === "lifetime"
                    ? "Current Plan"
                    : "Choose Payment Method"
                }
                onUpgrade={() => handleSelectPlan("lifetime")}
                currentPlan={currentTier === "lifetime"}
                disabled={currentTier === "lifetime"}
                loading={isLoading === "lifetime"}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
