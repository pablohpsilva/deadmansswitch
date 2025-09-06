import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";

interface PricingTier {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  maxEmails: number;
  maxRecipients: number;
}

interface PricingData {
  free?: PricingTier;
  premium?: PricingTier;
  lifetime?: PricingTier;
}

interface SimpleLandingPageProps {
  pricingData?: PricingData;
}

export function SimpleLandingPage({ pricingData }: SimpleLandingPageProps) {
  return (
    <div className="bg-gray-900 text-white scroll-smooth">
      {/* Shared Navigation */}
      <Navbar showBackToHome={false} showAuthLinks={true} />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 leading-tight">
            Dead Man's Switch
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-12">
            Send messages when you can't. A secure, decentralized system that
            ensures your important messages reach your loved ones when life
            takes unexpected turns.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* About Section - Why/How/When/Security */}
      <section
        id="about"
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-gray-800"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto">
              Everything you need to know about protecting your digital legacy
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Why Column */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">?</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                  Why?
                </h3>
              </div>
              <div className="text-sm sm:text-base text-gray-300 leading-relaxed space-y-3">
                <p>
                  Bad things happen. If something <strong>does</strong> happen,
                  you might wish you had told people around you how you feel.
                </p>
                <p>
                  What you regret, what you wish you had said, or ensuring your
                  pets are taken care of promptly.
                </p>
                <p>For that, you need a dead man's switch.</p>
              </div>
            </div>

            {/* How Column */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">✓</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                  How?
                </h3>
              </div>
              <div className="text-sm sm:text-base text-gray-300 leading-relaxed space-y-3">
                <p>
                  You write emails and choose recipients. These emails are
                  encrypted and stored privately until they're sent.
                </p>
                <p>
                  We regularly ask you to check in. If something happens, your
                  switch sends your messages.
                </p>
                <p>Sort of an "electronic will".</p>
              </div>
            </div>

            {/* When Column */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">⏰</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                  When?
                </h3>
              </div>
              <div className="text-sm sm:text-base text-gray-300 leading-relaxed space-y-3">
                <p>
                  Notifications sent at intervals you control - from days to
                  years. Set whatever feels right.
                </p>
                <p>
                  Default: notifications at 30, 45, and 52 days. No response?
                  Messages sent at 60 days.
                </p>
                <p>
                  Always postpone if you'll be away - complete control over
                  timing.
                </p>
              </div>
            </div>

            {/* Security Column */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">🔒</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                  Safe?
                </h3>
              </div>
              <div className="text-sm sm:text-base text-gray-300 leading-relaxed space-y-3">
                <p>
                  Messages <strong>encrypted on your device</strong> before
                  reaching our servers. We literally cannot read them.
                </p>
                <p>
                  Even if forced to hand over data, all they get is encrypted
                  gibberish. Keys never leave your device.
                </p>
                <p>
                  Built with <strong>Nostr protocol</strong> - technology
                  activists use worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-gray-900"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-white">
              Simple Pricing
            </h2>
            <div className="text-base sm:text-lg text-gray-300 leading-relaxed space-y-4 max-w-3xl mx-auto">
              <p>
                <strong>Start for free</strong> with up to{" "}
                {pricingData?.free?.maxEmails || 2} emails and{" "}
                {pricingData?.free?.maxRecipients || 2} recipients each. Upgrade
                when you need more.
              </p>
              <p>
                Premium plans include <strong>custom check-in intervals</strong>{" "}
                and enhanced security with multi-relay storage.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            {pricingData?.free && (
              <div className="border border-gray-600 p-6 md:p-8 rounded-lg hover:border-gray-500 transition-colors">
                <div className="text-center mb-6">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    {pricingData.free.name}
                  </h3>
                  <p className="text-3xl md:text-4xl font-bold mb-1">
                    {pricingData.free.price}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {pricingData.free.period}
                  </p>
                </div>
                <ul className="space-y-3 text-gray-300 text-sm md:text-base mb-8">
                  {pricingData.free.features
                    .slice(0, 4)
                    .map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                </ul>
                <Link
                  href="/auth/login"
                  className="block w-full py-3 text-center border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Get Started Free
                </Link>
              </div>
            )}

            {/* Premium Tier */}
            {pricingData?.premium && (
              <div className="border border-blue-500 p-6 md:p-8 rounded-lg bg-blue-500/10 relative scale-105 shadow-lg">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    {pricingData.premium.name}
                  </h3>
                  <p className="text-3xl md:text-4xl font-bold mb-1">
                    {pricingData.premium.price}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {pricingData.premium.period}
                  </p>
                </div>
                <ul className="space-y-3 text-gray-300 text-sm md:text-base mb-8">
                  {pricingData.premium.features
                    .slice(0, 5)
                    .map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-400 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                </ul>
                <Link
                  href="/auth/login"
                  className="block w-full py-3 text-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                >
                  Start Premium
                </Link>
              </div>
            )}

            {/* Lifetime Tier */}
            {pricingData?.lifetime && (
              <div className="border border-gray-600 p-6 md:p-8 rounded-lg hover:border-gray-500 transition-colors">
                <div className="text-center mb-6">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    {pricingData.lifetime.name}
                  </h3>
                  <p className="text-3xl md:text-4xl font-bold mb-1">
                    {pricingData.lifetime.price}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {pricingData.lifetime.period}
                  </p>
                </div>
                <ul className="space-y-3 text-gray-300 text-sm md:text-base mb-8">
                  {pricingData.lifetime.features
                    .slice(0, 5)
                    .map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                </ul>
                <Link
                  href="/auth/login"
                  className="block w-full py-3 text-center border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Buy Lifetime
                </Link>
              </div>
            )}

            {/* Fallback if no pricing data */}
            {!pricingData && (
              <>
                <div className="border border-gray-600 p-6 md:p-8 rounded-lg">
                  <h3 className="text-xl md:text-2xl font-bold mb-4">Free</h3>
                  <p className="text-2xl md:text-3xl font-bold mb-4">$0</p>
                  <ul className="space-y-2 text-gray-300 text-sm md:text-base">
                    <li>• Up to 2 emails</li>
                    <li>• 2 recipients per email</li>
                    <li>• Basic scheduling</li>
                    <li>• Secure encryption</li>
                  </ul>
                </div>
                <div className="border border-blue-500 p-6 md:p-8 rounded-lg bg-blue-500/10">
                  <h3 className="text-xl md:text-2xl font-bold mb-4">
                    Premium
                  </h3>
                  <p className="text-2xl md:text-3xl font-bold mb-4">
                    From $13.50/year
                  </p>
                  <ul className="space-y-2 text-gray-300 text-sm md:text-base">
                    <li>• Up to 100 emails</li>
                    <li>• 10 recipients per email</li>
                    <li>• Custom intervals</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            Start protecting what matters most. Create your Dead Man's Switch in
            minutes - it's completely free to get started.
          </p>

          <Link
            href="/auth/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-lg text-lg sm:text-xl font-bold transition-colors"
          >
            Get Started Free
          </Link>

          <div className="mt-12 sm:mt-16">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-white">
              Why No Mobile Apps?
            </h3>
            <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Recent changes on iOS and Android make most apps less secure. Big
              tech companies are being forced to spy on users under the guise of
              "child safety" and anti-terrorism. For your security and privacy,
              we provide a secure web-based platform instead.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t border-gray-800 text-center text-gray-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-sm sm:text-base">
            © 2024 Dead Man's Switch. Built with security and trust in mind.
          </p>
        </div>
      </footer>
    </div>
  );
}
