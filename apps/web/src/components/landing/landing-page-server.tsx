import { SimpleLandingPage } from "./simple-landing";
import { getBaseUrl } from "@/lib/trpc";

// Fetch pricing data from backend API
async function getPricingData() {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/trpc/payments.getPublicPricing`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Enable caching for better performance
      next: {
        revalidate: 300, // Cache for 5 minutes
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch pricing data:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data.result?.data || null;
  } catch (error) {
    console.error("Error fetching pricing data:", error);
    return null;
  }
}

export async function LandingPageServer() {
  const pricingData = await getPricingData();

  return <SimpleLandingPage pricingData={pricingData} />;
}
