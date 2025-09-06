"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePrefetchStrategies } from "@/hooks/useAdvancedQueries";

interface AppStats {
  totalUsers: number;
  messagesDelivered: number;
  uptime: string;
  lastUpdated: string;
}

interface LandingPageClientProps {
  initialStats: AppStats;
}

export function LandingPageClient({ initialStats }: LandingPageClientProps) {
  const { prefetchOnHover } = usePrefetchStrategies();

  // Use React Query to keep stats fresh with server-rendered initial data
  const { data: appStats } = useQuery({
    queryKey: ["app-stats"],
    queryFn: async () => {
      // In production, this would call your real-time stats API
      // For now, simulate fresh data
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        ...initialStats,
        totalUsers: initialStats.totalUsers + Math.floor(Math.random() * 10),
        lastUpdated: new Date().toISOString(),
      };
    },
    initialData: initialStats, // Use server-rendered data as initial state
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // Update every minute for live stats
  });

  return (
    <section className="py-20 bg-blue-600">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to Build Your Safety Net?
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Join {appStats.totalUsers.toLocaleString()}+ users who trust Dead
          Man's Switch to protect what matters most.
        </p>

        {/* Live stats display with real-time updates */}
        <div className="flex justify-center items-center space-x-8 mb-8 text-blue-100">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {appStats.totalUsers.toLocaleString()}
            </div>
            <div className="text-sm opacity-90">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {appStats.messagesDelivered.toLocaleString()}
            </div>
            <div className="text-sm opacity-90">Messages Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{appStats.uptime}</div>
            <div className="text-sm opacity-90">Uptime</div>
          </div>
        </div>

        <Link
          href="/auth/login"
          onMouseEnter={() => prefetchOnHover("dashboard")}
          className="bg-gray-800 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-colors shadow-lg inline-block"
        >
          Start Your Free Account
        </Link>

        {/* Last updated indicator */}
        <div className="mt-4 text-xs text-blue-200 opacity-70">
          Stats updated: {new Date(appStats.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </section>
  );
}
