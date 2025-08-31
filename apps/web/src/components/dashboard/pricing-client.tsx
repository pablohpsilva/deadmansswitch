"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useGlobalData, useAuthStatus } from "@/hooks/useGlobalData";
import { Section, SectionHeader } from "@/components/ui/card";
import { PricingCard, FeatureComparison, FAQ } from "@/components/ui/pricing";
import { Navbar } from "@/components/ui/navbar";

interface PricingTier {
  name: string;
  price: number;
  interval?: string;
  lightning?: number;
  features: string[];
}

export function PricingClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showCancelMessage, setShowCancelMessage] = useState(false);
  const { user } = useGlobalData();
  const { isAuthenticated } = useAuthStatus();

  // Check for payment cancel in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("canceled") === "true") {
      setShowCancelMessage(true);
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/pricing");

      // Hide cancel message after 5 seconds
      setTimeout(() => setShowCancelMessage(false), 5000);
    }
  }, []);

  // Fetch pricing data
  const { data: pricing, isLoading: pricingLoading } =
    trpc.payments.getPricing.useQuery();

  // Fetch current subscription status
  const { data: subscription, isLoading: subscriptionLoading } =
    trpc.payments.getSubscription.useQuery();

  // Mutations
  const createCheckout = trpc.payments.createPremiumCheckout.useMutation();
  const createLifetimeCheckout =
    trpc.payments.createLifetimeCheckout.useMutation();
  const cancelSubscription = trpc.payments.cancelSubscription.useMutation();

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/");
  };

  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  if (pricingLoading || subscriptionLoading) {
    return (
      <>
        <Navbar user={user} onLogout={handleLogout} />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pricing information...</p>
          </div>
        </div>
      </>
    );
  }

  const handleUpgrade = async (tier: "premium" | "lifetime") => {
    setIsLoading(tier);
    try {
      let checkoutUrl: string;

      const currentUrl = window.location.origin;
      const successUrl = `${currentUrl}/dashboard?upgrade=success`;
      const cancelUrl = `${currentUrl}/dashboard/pricing?canceled=true`;

      if (tier === "premium") {
        const result = await createCheckout.mutateAsync({
          successUrl,
          cancelUrl,
        });
        checkoutUrl = result.url;
      } else {
        const result = await createLifetimeCheckout.mutateAsync({
          successUrl,
          cancelUrl,
        });
        checkoutUrl = result.url;
      }

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period."
      )
    ) {
      return;
    }

    try {
      await cancelSubscription.mutateAsync();
      alert(
        "Subscription cancelled successfully. You'll still have access until the end of your billing period."
      );
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      alert(
        "Failed to cancel subscription. Please try again or contact support."
      );
    }
  };

  const currentTier = user?.tier || "free";
  const isSubscriptionActive = subscription?.status === "active";
  const subscriptionEnds = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;

  return (
    <>
      {/* Navigation */}
      <Navbar user={user} onLogout={handleLogout} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Cancel Message */}
        {showCancelMessage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Payment Cancelled
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  No worries! You can upgrade whenever you're ready.
                </p>
              </div>
              <button
                onClick={() => setShowCancelMessage(false)}
                className="ml-auto text-yellow-500 hover:text-yellow-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <Section className="pt-24 pb-8">
          <SectionHeader
            title="Choose Your Plan"
            subtitle="Start free, upgrade when you need more. All plans include military-grade encryption and decentralized storage."
          />
        </Section>

        {/* Current Plan Section */}
        <Section background="gray">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Your Current Plan
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 capitalize">
                      {currentTier} Plan
                    </h3>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      Current
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {currentTier === "free" &&
                      "Perfect for getting started with basic features"}
                    {currentTier === "premium" && isSubscriptionActive && (
                      <>
                        Premium features active until{" "}
                        <span className="font-semibold">
                          {subscriptionEnds?.toLocaleDateString()}
                        </span>
                      </>
                    )}
                    {currentTier === "premium" &&
                      !isSubscriptionActive &&
                      "Premium features available (subscription needs renewal)"}
                    {currentTier === "lifetime" &&
                      "Lifetime access to all premium features"}
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end space-y-3">
                  {currentTier === "premium" && isSubscriptionActive && (
                    <button
                      onClick={handleCancelSubscription}
                      className="px-6 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium"
                    >
                      Cancel Subscription
                    </button>
                  )}
                  {currentTier === "free" && (
                    <div className="text-left md:text-right">
                      <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                        Upgrade Available
                      </span>
                      <p className="text-sm text-gray-600 mt-2">
                        Unlock more emails and advanced features
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Pricing Plans */}
        <Section>
          {pricing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <PricingCard
                name={pricing.free.name}
                price={pricing.free.price}
                description="Perfect for getting started"
                features={pricing.free.features}
                buttonText={
                  currentTier === "free" ? "Current Plan" : "Downgrade"
                }
                onUpgrade={() => {}}
                currentPlan={currentTier === "free"}
                disabled={currentTier === "free"}
              />

              <PricingCard
                name={pricing.premium.name}
                price={pricing.premium.price}
                period="/year"
                description="For serious users"
                features={pricing.premium.features}
                buttonText={
                  currentTier === "free"
                    ? "Upgrade to Premium"
                    : currentTier === "premium"
                    ? "Current Plan"
                    : "Not Available"
                }
                onUpgrade={() => handleUpgrade("premium")}
                popular={currentTier === "free"}
                currentPlan={currentTier === "premium"}
                disabled={currentTier !== "free"}
                loading={isLoading === "premium"}
              />

              <PricingCard
                name={pricing.lifetime.name}
                price={pricing.lifetime.price}
                period="one-time"
                description="Pay once, use forever"
                features={pricing.lifetime.features}
                buttonText={
                  currentTier === "lifetime"
                    ? "Current Plan"
                    : "Get Lifetime Access"
                }
                onUpgrade={() => handleUpgrade("lifetime")}
                currentPlan={currentTier === "lifetime"}
                disabled={currentTier === "lifetime"}
                loading={isLoading === "lifetime"}
              />
            </div>
          )}
        </Section>

        {/* Features Comparison */}
        <Section background="gray">
          <SectionHeader
            title="Feature Comparison"
            subtitle="Compare what's included in each plan"
          />

          {pricing && (
            <FeatureComparison
              plans={[
                {
                  name: "Free",
                  features: {
                    maxEmails: "2",
                    recipients: "2",
                    subjectLength: "125 chars",
                    contentLength: "2K chars",
                    scheduling: "Basic",
                    encryption: true,
                    support: false,
                    updates: false,
                  },
                },
                {
                  name: "Premium",
                  features: {
                    maxEmails: "100",
                    recipients: "10",
                    subjectLength: "300 chars",
                    contentLength: "10K chars",
                    scheduling: "Advanced",
                    encryption: true,
                    support: true,
                    updates: false,
                  },
                },
                {
                  name: "Lifetime",
                  features: {
                    maxEmails: "100",
                    recipients: "10",
                    subjectLength: "300 chars",
                    contentLength: "10K chars",
                    scheduling: "Advanced",
                    encryption: true,
                    support: true,
                    updates: true,
                  },
                },
              ]}
              featureLabels={{
                maxEmails: "Max Emails",
                recipients: "Recipients per Email",
                subjectLength: "Subject Length",
                contentLength: "Content Length",
                scheduling: "Scheduling",
                encryption: "Nostr Encryption",
                support: "Priority Support",
                updates: "Lifetime Updates",
              }}
            />
          )}
        </Section>

        {/* FAQ Section */}
        <Section>
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about our pricing and plans"
          />

          <FAQ
            items={[
              {
                question: "Can I change my plan later?",
                answer:
                  "Absolutely! You can upgrade from Free to Premium or Lifetime at any time. You can also cancel your Premium subscription, though you'll keep access until the end of your billing period.",
              },
              {
                question: "What happens if I cancel Premium?",
                answer:
                  "You'll continue to have Premium features until the end of your current billing period, then your account will revert to the Free tier with all data intact.",
              },
              {
                question: "Is the Lifetime plan really lifetime?",
                answer:
                  "Yes! Pay once and get access to all Premium features forever, including future updates and improvements. It's a one-time investment for unlimited access.",
              },
              {
                question: "Do you offer refunds?",
                answer:
                  "We offer a 30-day money-back guarantee for all card payments through Stripe. Cryptocurrency payments are final and non-refundable due to their irreversible nature.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We currently accept all major credit cards through Stripe. Bitcoin and Lightning payment options are planned for future releases.",
              },
              {
                question: "Is my data secure during upgrades?",
                answer:
                  "Yes! All your encrypted emails and settings remain secure during plan changes. Upgrades are instant and don't affect your existing data.",
              },
            ]}
          />
        </Section>

        {/* Bottom CTA */}
        <Section background="gray">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Secure Your Digital Legacy?
            </h3>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Join thousands of users who trust our platform with their most
              important messages. Start free, upgrade when you need more power.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>30-day money back guarantee*</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Military-grade encryption</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              * 30-day money back guarantee applies to card payments only.
              Cryptocurrency payments are final.
            </p>
          </div>
        </Section>
      </div>
    </>
  );
}

// Import the skeleton component for consistency
import { PricingSkeleton } from "./pricing-skeleton";
