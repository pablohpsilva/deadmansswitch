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
    <div className="min-h-screen bg-gray-50">
      {/* Server-rendered header shell for SEO */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Dead Man's Switch
              </h1>
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
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient />
      </Suspense>
    </div>
  );
}
