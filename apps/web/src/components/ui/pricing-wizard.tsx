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
  ChevronRight,
  Star,
} from "lucide-react";

export type PaymentMethod = "stripe" | "lightning" | "stablecoin";
export type StablecoinToken = "USDT" | "USDC";
export type StablecoinNetwork = "Ethereum" | "TRON";
export type Tier = "premium" | "lifetime";

interface PricingData {
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
}

interface PricingWizardProps {
  premiumData: PricingData;
  lifetimeData: PricingData;
  onComplete: (
    tier: Tier,
    method: PaymentMethod,
    details?: { token?: StablecoinToken; network?: StablecoinNetwork }
  ) => void;
  isLoading?: boolean;
  className?: string;
}

type WizardStep = "tier" | "payment" | "details" | "confirm";

export function PricingWizard({
  premiumData,
  lifetimeData,
  onComplete,
  isLoading = false,
  className = "",
}: PricingWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("tier");
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [selectedToken, setSelectedToken] = useState<StablecoinToken>("USDT");
  const [selectedNetwork, setSelectedNetwork] =
    useState<StablecoinNetwork>("Ethereum");

  const getCurrentPricingData = () => {
    return selectedTier === "premium" ? premiumData : lifetimeData;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "tier":
        return "Choose Your Plan";
      case "payment":
        return "Payment Method";
      case "details":
        return "Payment Details";
      case "confirm":
        return "Confirm Payment";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case "tier":
        return "Select the plan that works for you";
      case "payment":
        return "How would you like to pay?";
      case "details":
        return "Configure payment options";
      case "confirm":
        return "Review your selection";
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "tier":
        return selectedTier !== null;
      case "payment":
        return selectedMethod !== null;
      case "details":
        return (
          selectedMethod !== "stablecoin" || (selectedToken && selectedNetwork)
        );
      case "confirm":
        return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    switch (currentStep) {
      case "tier":
        setCurrentStep("payment");
        break;
      case "payment":
        if (selectedMethod === "stablecoin") {
          setCurrentStep("details");
        } else {
          setCurrentStep("confirm");
        }
        break;
      case "details":
        setCurrentStep("confirm");
        break;
      case "confirm":
        handleComplete();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "payment":
        setCurrentStep("tier");
        break;
      case "details":
        setCurrentStep("payment");
        break;
      case "confirm":
        if (selectedMethod === "stablecoin") {
          setCurrentStep("details");
        } else {
          setCurrentStep("payment");
        }
        break;
    }
  };

  const handleComplete = () => {
    if (!selectedTier || !selectedMethod) return;

    const details =
      selectedMethod === "stablecoin"
        ? { token: selectedToken, network: selectedNetwork }
        : undefined;

    onComplete(selectedTier, selectedMethod, details);
  };

  const resetWizard = () => {
    setCurrentStep("tier");
    setSelectedTier(null);
    setSelectedMethod(null);
    setSelectedToken("USDT");
    setSelectedNetwork("Ethereum");
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>
            Step{" "}
            {["tier", "payment", "details", "confirm"].indexOf(currentStep) + 1}{" "}
            of 4
          </span>
          <button
            onClick={resetWizard}
            className="text-blue-600 hover:text-blue-800"
          >
            Start Over
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                (["tier", "payment", "details", "confirm"].indexOf(
                  currentStep
                ) +
                  1) *
                25
              }%`,
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {getStepTitle()}
        </h2>
        <p className="text-sm text-gray-600">{getStepSubtitle()}</p>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[300px]">
        {/* Step 1: Tier Selection */}
        {currentStep === "tier" && (
          <div className="space-y-3">
            <TierOption
              title="Premium Plan"
              price="From $13.50"
              period="/year"
              description="Perfect for regular users"
              features={[
                "100 emails",
                "10 recipients each",
                "Up to 10 relays",
                "Advanced features",
              ]}
              discount="Up to 10% off"
              isSelected={selectedTier === "premium"}
              onClick={() => setSelectedTier("premium")}
              popular={true}
            />
            <TierOption
              title="Lifetime Plan"
              price="From $54"
              period=" one-time"
              description="Pay once, use forever"
              features={[
                "50 emails",
                "10 recipients each",
                "Up to 3 relays",
                "Lifetime updates",
              ]}
              discount="Up to 10% off"
              isSelected={selectedTier === "lifetime"}
              onClick={() => setSelectedTier("lifetime")}
            />
          </div>
        )}

        {/* Step 2: Payment Method Selection */}
        {currentStep === "payment" && selectedTier && (
          <div className="space-y-3">
            <PaymentOption
              icon={CreditCard}
              title="Credit Card"
              price={getCurrentPricingData().paymentMethods.stripe.price}
              originalPrice={
                getCurrentPricingData().paymentMethods.stripe.price
              }
              features={[
                "Instant activation",
                "Familiar process",
                "Buyer protection",
              ]}
              requirements={["KYC required", "Tax by location"]}
              isSelected={selectedMethod === "stripe"}
              onClick={() => setSelectedMethod("stripe")}
            />

            <PaymentOption
              icon={Zap}
              title="Bitcoin Lightning"
              price={getCurrentPricingData().paymentMethods.lightning.price}
              originalPrice={
                getCurrentPricingData().paymentMethods.stripe.price
              }
              badge="10% OFF"
              badgeColor="bg-orange-500"
              features={[
                "10% discount",
                "Complete privacy",
                "No taxes",
                "Instant settlement",
              ]}
              cryptoAmount={
                getCurrentPricingData().paymentMethods.lightning.satsAmount
              }
              cryptoUnit="sats"
              isSelected={selectedMethod === "lightning"}
              onClick={() => setSelectedMethod("lightning")}
            />

            <PaymentOption
              icon={Coins}
              title="Stablecoins"
              price={getCurrentPricingData().paymentMethods.stablecoin.price}
              originalPrice={
                getCurrentPricingData().paymentMethods.stripe.price
              }
              badge="7% OFF"
              badgeColor="bg-green-500"
              features={[
                "7% discount",
                "No personal info",
                "No taxes",
                "USDT & USDC",
              ]}
              isSelected={selectedMethod === "stablecoin"}
              onClick={() => setSelectedMethod("stablecoin")}
            />
          </div>
        )}

        {/* Step 3: Stablecoin Details */}
        {currentStep === "details" && selectedMethod === "stablecoin" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Choose Token
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {getCurrentPricingData().paymentMethods.stablecoin.acceptedTokens.map(
                  (token) => (
                    <button
                      key={token}
                      onClick={() => setSelectedToken(token as StablecoinToken)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center font-medium transition-colors",
                        selectedToken === token
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {token}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Choose Network
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {getCurrentPricingData().paymentMethods.stablecoin.networks.map(
                  (network) => (
                    <button
                      key={network}
                      onClick={() =>
                        setSelectedNetwork(network as StablecoinNetwork)
                      }
                      className={cn(
                        "p-3 rounded-lg border-2 text-center font-medium transition-colors",
                        selectedNetwork === network
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {network}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === "confirm" && selectedTier && selectedMethod && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium capitalize">{selectedTier}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    {selectedMethod === "stripe" && "Credit Card"}
                    {selectedMethod === "lightning" && "Bitcoin Lightning"}
                    {selectedMethod === "stablecoin" &&
                      `${selectedToken} (${selectedNetwork})`}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-gray-600">Total:</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">
                      $
                      {
                        getCurrentPricingData().paymentMethods[selectedMethod]
                          .price
                      }
                    </span>
                    {getCurrentPricingData().paymentMethods[selectedMethod]
                      .discount > 0 && (
                      <div className="text-xs text-green-600">
                        {
                          getCurrentPricingData().paymentMethods[selectedMethod]
                            .discount
                        }
                        % savings
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Secure Payment</p>
                  <p>
                    Your payment is processed securely with end-to-end
                    encryption.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex space-x-3 mt-6">
        {currentStep !== "tier" && (
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1 flex items-center justify-center"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}

        <Button
          onClick={handleNext}
          variant="primary"
          disabled={!canProceed() || isLoading}
          loading={isLoading && currentStep === "confirm"}
          className={cn(
            "flex items-center justify-center",
            currentStep === "tier" ? "w-full" : "flex-1"
          )}
        >
          {currentStep === "confirm" ? (
            <>
              {selectedMethod === "stripe" && "Pay with Card"}
              {selectedMethod === "lightning" && "Pay with Bitcoin"}
              {selectedMethod === "stablecoin" &&
                `Pay ${
                  getCurrentPricingData().paymentMethods[selectedMethod].price
                }`}
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Sub-components
function TierOption({
  title,
  price,
  period,
  description,
  features,
  discount,
  isSelected,
  onClick,
  popular = false,
}: {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  discount: string;
  isSelected: boolean;
  onClick: () => void;
  popular?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      {popular && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
            <Star className="h-3 w-3 mr-1" />
            Popular
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{price}</div>
          <div className="text-xs text-gray-600">{period}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <ul className="text-xs text-gray-600">
          {features.map((feature, idx) => (
            <li key={idx}>• {feature}</li>
          ))}
        </ul>

        <div className="flex items-center">
          <div className="text-xs text-green-600 font-medium mr-2">
            {discount}
          </div>
          <div
            className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
              isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
            )}
          >
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentOption({
  icon: Icon,
  title,
  price,
  originalPrice,
  badge,
  badgeColor,
  features,
  requirements,
  cryptoAmount,
  cryptoUnit,
  isSelected,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  price: number;
  originalPrice: number;
  badge?: string;
  badgeColor?: string;
  features: string[];
  requirements?: string[];
  cryptoAmount?: number;
  cryptoUnit?: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
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

      <div className="flex items-center space-x-3 mb-3">
        <div
          className={cn(
            "p-2 rounded-lg",
            isSelected ? "bg-blue-100" : "bg-gray-100"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              isSelected ? "text-blue-600" : "text-gray-600"
            )}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <div className="text-right">
              <div className="flex items-center space-x-1">
                {originalPrice !== price && (
                  <span className="text-sm text-gray-500 line-through">
                    ${originalPrice}
                  </span>
                )}
                <span className="text-lg font-bold text-gray-900">
                  ${price}
                </span>
              </div>
              {cryptoAmount && cryptoUnit && (
                <div className="text-xs text-gray-600">
                  ≈ {cryptoAmount.toLocaleString()} {cryptoUnit}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
            isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div>
          <ul className="text-xs text-gray-600">
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
            <ul className="text-xs text-gray-500">
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
  );
}
