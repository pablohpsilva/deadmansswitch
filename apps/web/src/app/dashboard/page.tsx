import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Server Component for initial authentication check and SSR
export default async function DashboardPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  // If no token in cookies, check if it might be in localStorage (client-side)
  // For now, we'll let the client handle this, but in production you'd want
  // proper server-side session management

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Main content with Suspense for streaming */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient />
      </Suspense>
    </div>
  );
}
