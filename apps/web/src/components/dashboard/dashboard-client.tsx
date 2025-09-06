"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmailList } from "./EmailList";
import { EmailForm } from "./EmailForm";
import { TierLimits } from "./TierLimits";
import { EmailDetailView } from "./EmailDetailView";
import { WalletManager } from "./WalletManagerClean";
import { AuthDebugger } from "../debug/auth-debug";
import { useDashboardData } from "@/hooks/useAdvancedQueries";
import { useBackgroundSync } from "@/hooks/useAdvancedQueries";
import { useUserPreferences } from "@/hooks/usePersistedState";
import { useGlobalData } from "@/hooks/useGlobalData";
import { Card, Button } from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";

type ViewMode = "list" | "create" | "edit" | "view";

export function DashboardClient() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Enhanced dashboard data with React Query
  const {
    emails,
    emailsLoading,
    emailsError,
    tierLimits,
    tierLoading,
    user,
    userLoading,
    isLoading: dashboardLoading,
    isReady,
    hasErrors,
    queryStatus,
  } = useDashboardData();

  // Background sync for real-time updates
  const syncStatus = useBackgroundSync();

  // User preferences
  const { data: preferences, update: updatePreferences } = useUserPreferences();

  // Global data with auth refresh capabilities
  const { refreshIfNeeded, logout } = useGlobalData();

  // Check authentication and handle payment success
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Preemptively refresh token if needed
    refreshIfNeeded().catch((error) => {
      console.error("Failed to refresh token on dashboard load:", error);
      // If refresh fails, the auth refresh hook will handle logout
    });

    // Check for payment success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("upgrade") === "success") {
      setShowSuccessMessage(true);
      // Clean up URL without triggering navigation
      window.history.replaceState({}, "", "/dashboard");

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [router, refreshIfNeeded]);

  // Refetch function for backward compatibility
  const refetchEmails = () => {
    // This would typically invalidate the query
    window.location.reload(); // Simple refresh for now
  };

  const handleCreateEmail = () => {
    setSelectedEmailId(null);
    setViewMode("create");
  };

  const handleEditEmail = (emailId: string) => {
    setSelectedEmailId(emailId);
    setViewMode("edit");
  };

  const handleViewEmail = (emailId: string) => {
    setSelectedEmailId(emailId);
    setViewMode("view");
  };

  const handleBackToList = () => {
    setSelectedEmailId(null);
    setViewMode("list");
    refetchEmails();
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/");
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when view mode changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [viewMode]);

  if (dashboardLoading || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dashboard...</p>
          <div className="mt-4 text-xs text-gray-500 max-w-md">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <span>User data:</span>
                <span>
                  {queryStatus.user.loading && "Loading..."}
                  {queryStatus.user.success && "Loaded"}
                  {queryStatus.user.error && "Failed"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Emails:</span>
                <span>
                  {queryStatus.emails.loading && "Loading..."}
                  {queryStatus.emails.success && "Loaded"}
                  {queryStatus.emails.error && "Failed"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tier limits:</span>
                <span>
                  {queryStatus.tierLimits.loading && "Loading..."}
                  {queryStatus.tierLimits.success && "Loaded"}
                  {queryStatus.tierLimits.error && "Failed"}
                </span>
              </div>
            </div>

            {/* Show specific errors if any */}
            {hasErrors && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-left">
                <h4 className="font-medium text-red-800 mb-2">
                  Connection Issues:
                </h4>
                <div className="text-red-700 text-xs space-y-1">
                  {queryStatus.user.error && (
                    <div>• User: {queryStatus.user.errorMsg}</div>
                  )}
                  {queryStatus.emails.error && (
                    <div>• Emails: {queryStatus.emails.errorMsg}</div>
                  )}
                  {queryStatus.tierLimits.error && (
                    <div>• Tier: {queryStatus.tierLimits.errorMsg}</div>
                  )}
                </div>
                <div className="mt-3 text-xs text-red-600">
                  Try refreshing the page or check if the backend server is
                  running.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user || hasErrors) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">
              {!user ? "Authentication Required" : "Dashboard Error"}
            </h2>
            <p className="text-gray-300 mb-4">
              {!user
                ? "Your session has expired. We're attempting to refresh your authentication..."
                : "We're having trouble loading your dashboard data."}
            </p>
          </div>

          {hasErrors && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <h4 className="font-medium text-red-800 mb-2">
                Connection Issues:
              </h4>
              <div className="text-red-700 text-sm space-y-1">
                {queryStatus.user.error && (
                  <div>• Authentication: {queryStatus.user.errorMsg}</div>
                )}
                {queryStatus.emails.error && (
                  <div>• Emails: {queryStatus.emails.errorMsg}</div>
                )}
                {queryStatus.tierLimits.error && (
                  <div>• Settings: {queryStatus.tierLimits.errorMsg}</div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              className="w-full"
            >
              Retry Connection
            </Button>
            <Button onClick={logout} variant="outline" className="w-full">
              Sign Out & Return to Login
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            If the problem persists, please try clearing your browser cache or
            contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navigation */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onMobileMenuToggle={handleMobileMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Upgrade Successful!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Your account has been upgraded. You now have access to all
                premium features.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
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

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Sidebar - Hidden on mobile unless menu is open */}
            <div
              className={`lg:col-span-1 ${
                isMobileMenuOpen ? "block" : "hidden lg:block"
              } ${isMobileMenuOpen ? "mb-6" : ""}`}
            >
              <Card className="mb-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      viewMode === "list"
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-600 text-gray-200"
                    }`}
                  >
                    My Emails
                  </button>
                  <button
                    onClick={handleCreateEmail}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-600 text-gray-200 transition-colors"
                    disabled={
                      emails &&
                      tierLimits &&
                      emails.length >= tierLimits.maxEmails
                    }
                  >
                    Create Email
                  </button>
                  <Button
                    onClick={() => router.push("/dashboard/pricing")}
                    variant="primary"
                    className="w-full"
                  >
                    Upgrade Plan
                  </Button>
                </div>
              </Card>

              {/* Tier Limits */}
              {tierLimits && (
                <TierLimits
                  tierLimits={tierLimits}
                  currentEmails={emails?.length || 0}
                  userTier={user.tier}
                />
              )}

              {/* Wallet Manager */}
              <WalletManager className="mt-6" />
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Mobile: Show main content unless menu is open */}
              <div className={isMobileMenuOpen ? "hidden lg:block" : "block"}>
                {viewMode === "list" && (
                  <EmailList
                    emails={emails || []}
                    isLoading={emailsLoading}
                    onCreateEmail={handleCreateEmail}
                    onEditEmail={handleEditEmail}
                    onViewEmail={handleViewEmail}
                    onRefresh={refetchEmails}
                  />
                )}

                {(viewMode === "create" || viewMode === "edit") && (
                  <EmailForm
                    mode={viewMode}
                    emailId={selectedEmailId}
                    onSuccess={handleBackToList}
                    onCancel={handleBackToList}
                    tierLimits={tierLimits}
                  />
                )}

                {viewMode === "view" && selectedEmailId && (
                  <EmailDetailView
                    emailId={selectedEmailId}
                    onEdit={() => handleEditEmail(selectedEmailId)}
                    onBack={handleBackToList}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Debug helper in development */}
      {process.env.NODE_ENV === "development" && <AuthDebugger />}
    </>
  );
}
