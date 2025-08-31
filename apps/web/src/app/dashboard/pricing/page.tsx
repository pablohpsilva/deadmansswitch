import { Suspense } from "react";
import { PricingClient } from "@/components/dashboard/pricing-client";
import { PricingSkeleton } from "@/components/dashboard/pricing-skeleton";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Server Component for pricing page with authentication check
export default async function PricingPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  // Meta tags for SEO
  const title = "Pricing - Dead Man's Switch";
  const description =
    "Choose the perfect plan for your needs. Secure, encrypted messaging with flexible pricing options.";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Server-rendered header shell for SEO */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Dead Man's Switch
              </h1>
              <nav className="hidden md:flex space-x-6">
                <a
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </a>
                <span className="text-blue-600 font-semibold">Pricing</span>
              </nav>
            </div>

            {/* Mobile menu */}
            <div className="md:hidden">
              <a
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 p-2 inline-flex items-center"
              >
                ← Back
              </a>
            </div>
            <div className="flex items-center space-x-4">
              {/* Skeleton for user profile during SSR */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with Suspense for streaming */}
      <Suspense fallback={<PricingSkeleton />}>
        <PricingClient />
      </Suspense>
    </div>
  );
}

// Metadata export for Next.js
export const metadata = {
  title: "Pricing - Dead Man's Switch",
  description:
    "Choose the perfect plan for your needs. Secure, encrypted messaging with flexible pricing options.",
};
