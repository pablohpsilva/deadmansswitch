"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmailList } from "./EmailList";
import { EmailForm } from "./EmailForm";
import { UserProfile } from "./UserProfile";
import { TierLimits } from "./TierLimits";
import { EmailDetailView } from "./EmailDetailView";
import { useDashboardData } from "@/hooks/useAdvancedQueries";
import { useBackgroundSync } from "@/hooks/useAdvancedQueries";
import { useUserPreferences } from "@/hooks/usePersistedState";

type ViewMode = "list" | "create" | "edit" | "view";

export function DashboardClient() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

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
  } = useDashboardData();

  // Background sync for real-time updates
  const syncStatus = useBackgroundSync();

  // User preferences
  const { data: preferences, update: updatePreferences } = useUserPreferences();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
  }, [router]);

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

  if (dashboardLoading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <div className="mt-4 text-xs text-gray-500">
            <p>Loading user data: {userLoading ? "⏳" : "✅"}</p>
            <p>Loading emails: {emailsLoading ? "⏳" : "✅"}</p>
            <p>Loading tier limits: {tierLoading ? "⏳" : "✅"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || hasErrors) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {!user ? "Authentication required" : "Error loading dashboard data"}
          </p>
          {hasErrors && (
            <div className="mb-4 text-sm text-red-500">
              {emailsError && <p>Email error: {emailsError.message}</p>}
            </div>
          )}
          <button
            onClick={() => router.push("/auth/login")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Enhanced Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Dead Man's Switch
              </h1>
              <span className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                {user.tier}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Background sync indicator */}
              {syncStatus.userSyncStatus === "success" && (
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  ✓ Synced
                </div>
              )}

              <UserProfile user={user} />

              {/* Layout toggle based on preferences */}
              <button
                onClick={() =>
                  updatePreferences({
                    ...preferences,
                    dashboardLayout:
                      preferences.dashboardLayout === "grid" ? "list" : "grid",
                  })
                }
                className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded text-xs"
                title={`Switch to ${
                  preferences.dashboardLayout === "grid" ? "list" : "grid"
                } view`}
              >
                {preferences.dashboardLayout === "grid" ? "☰" : "⊞"}
              </button>

              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={`w-full text-left px-3 py-2 rounded-lg ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  📧 My Emails
                </button>
                <button
                  onClick={handleCreateEmail}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                  disabled={
                    emails &&
                    tierLimits &&
                    emails.length >= tierLimits.maxEmails
                  }
                >
                  ➕ Create Email
                </button>
              </div>
            </div>

            {/* Tier Limits */}
            {tierLimits && (
              <TierLimits
                tierLimits={tierLimits}
                currentEmails={emails?.length || 0}
                userTier={user.tier}
              />
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
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
      </main>
    </>
  );
}
