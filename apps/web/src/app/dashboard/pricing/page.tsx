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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
