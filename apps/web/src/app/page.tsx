import { Suspense } from "react";
import { LandingPageServer } from "@/components/landing/landing-page-server";
import { LandingPageSkeleton } from "@/components/landing/landing-page-skeleton";

// This is now a Server Component that can be pre-rendered
export default function Home() {
  return (
    <Suspense fallback={<LandingPageSkeleton />}>
      <LandingPageServer />
    </Suspense>
  );
}
