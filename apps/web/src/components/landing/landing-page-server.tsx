import { Shield, Lock, Zap, Clock, Mail, Users, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LandingPageClient } from "./landing-page-client";

// Server Component for static content and initial SEO
async function getAppStats() {
  // In a real app, this would fetch from your API
  // For now, return static data that can be pre-rendered
  return {
    totalUsers: 12547,
    messagesDelivered: 8932,
    uptime: "99.9%",
    lastUpdated: new Date().toISOString(),
  };
}

export async function LandingPageServer() {
  // Fetch data on the server for initial render
  const appStats = await getAppStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation - Server rendered for SEO */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Dead Man's Switch
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="/auth/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Server rendered for SEO */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Send messages when
              <span className="text-blue-600 block">you can't</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              A secure, decentralized Dead Man's Switch that ensures your
              important messages reach your loved ones when life takes
              unexpected turns. Built with privacy-first Nostr technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/login"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Start Building Your Switch
              </Link>
              <Link
                href="#how-it-works"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Server rendered for SEO */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for Security & Trust
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every feature is designed with your privacy and security in mind,
              using cutting-edge decentralized technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-blue-600" />}
              title="Military-Grade Encryption"
              description="All messages are encrypted using NIP17 standard before being stored. Even we can't read your messages."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-green-600" />}
              title="Decentralized Storage"
              description="Your encrypted messages are stored across multiple Nostr relays, ensuring they're always available."
            />
            <FeatureCard
              icon={<Clock className="h-8 w-8 text-purple-600" />}
              title="Flexible Scheduling"
              description="Set custom check-in intervals or specific dates. You're in complete control of timing."
            />
            <FeatureCard
              icon={<Mail className="h-8 w-8 text-red-600" />}
              title="Smart Delivery"
              description="Messages are sent via email when triggered, with Nostr notifications for full transparency."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-yellow-600" />}
              title="Multiple Recipients"
              description="Send different messages to different people. Perfect for family, friends, or business partners."
            />
            <FeatureCard
              icon={<Lock className="h-8 w-8 text-indigo-600" />}
              title="Zero Knowledge"
              description="We never store your message content. Everything is encrypted client-side before transmission."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section - Server rendered for SEO */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple to set up, secure by design
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Write Your Messages"
              description="Compose heartfelt messages for your loved ones. Set recipients and customize content for each person."
            />
            <StepCard
              number="2"
              title="Set Your Schedule"
              description="Choose check-in intervals (30, 45, 52 days) or set specific dates. You can postpone anytime."
            />
            <StepCard
              number="3"
              title="Stay Connected"
              description="Regular check-ins keep your switch inactive. If you miss them, your messages are automatically sent."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section - Server rendered for SEO */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              description="Perfect for getting started"
              features={[
                "2 emails maximum",
                "2 recipients per email",
                "125 character subject",
                "2,000 character content",
                "Basic scheduling",
                "Nostr encryption",
              ]}
              buttonText="Get Started Free"
              buttonVariant="outline"
            />
            <PricingCard
              name="Premium"
              price="$15"
              period="per year"
              description="For serious users"
              features={[
                "100 emails maximum",
                "10 recipients per email",
                "300 character subject",
                "10,000 character content",
                "Advanced scheduling",
                "Nostr encryption",
                "Priority support",
              ]}
              buttonText="Upgrade to Premium"
              buttonVariant="primary"
              popular={true}
            />
            <PricingCard
              name="Lifetime"
              price="$60"
              period="one-time"
              description="Pay once, use forever"
              features={[
                "100 emails maximum",
                "10 recipients per email",
                "300 character subject",
                "10,000 character content",
                "Advanced scheduling",
                "Nostr encryption",
                "Lifetime updates",
                "Priority support",
              ]}
              buttonText="Get Lifetime Access"
              buttonVariant="outline"
            />
          </div>
        </div>
      </section>

      {/* CTA Section with Server-rendered stats, Client-side enhancements */}
      <LandingPageClient initialStats={appStats} />

      {/* Footer - Server rendered for SEO */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold text-white">
                  Dead Man's Switch
                </span>
              </div>
              <p className="text-gray-400 max-w-md">
                Secure, decentralized messaging for when life takes unexpected
                turns. Built with privacy-first Nostr technology.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/login"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/help"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-center text-gray-400">
              © 2024 Dead Man's Switch. Built with security and trust in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Server Component for features
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

// Server Component for steps
function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

// Server Component for pricing
function PricingCard({
  name,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant,
  popular = false,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: "primary" | "outline";
  popular?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative p-8 bg-white rounded-xl border-2 hover:shadow-lg transition-shadow",
        popular ? "border-blue-500" : "border-gray-200"
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
        <div className="mb-2">
          <span className="text-4xl font-bold text-gray-900">{price}</span>
          <span className="text-gray-600 ml-2">{period}</span>
        </div>
        <p className="text-gray-600">{description}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/auth/login"
        className={cn(
          "w-full py-3 px-6 rounded-lg text-center font-semibold transition-colors block",
          buttonVariant === "primary"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
        )}
      >
        {buttonText}
      </Link>
    </div>
  );
}
