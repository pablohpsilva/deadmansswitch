/**
 * Authentication Error Handler Component
 * Provides a graceful UI for handling authentication failures with auto-refresh
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/card";
import { useGlobalData } from "@/hooks/useGlobalData";

interface AuthErrorHandlerProps {
  error: any;
  onRetry?: () => void;
  onLoginRedirect?: () => void;
}

export function AuthErrorHandler({ 
  error, 
  onRetry, 
  onLoginRedirect 
}: AuthErrorHandlerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const { handleAuthError, logout } = useGlobalData();

  // Automatically attempt auth refresh on mount
  useEffect(() => {
    if (!refreshAttempted && error) {
      setRefreshAttempted(true);
      setIsRefreshing(true);
      
      handleAuthError(error)
        .then((success) => {
          setIsRefreshing(false);
          if (success && onRetry) {
            // Small delay to let the new token propagate
            setTimeout(onRetry, 500);
          }
        })
        .catch(() => {
          setIsRefreshing(false);
          // Auth refresh hook will handle logout if needed
        });
    }
  }, [error, refreshAttempted, handleAuthError, onRetry]);

  const handleManualRetry = async () => {
    setIsRefreshing(true);
    try {
      const success = await handleAuthError(error);
      if (success && onRetry) {
        setTimeout(onRetry, 500);
      }
    } catch (error) {
      console.error("Manual retry failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    if (onLoginRedirect) {
      onLoginRedirect();
    } else {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {isRefreshing ? (
              <svg className="w-8 h-8 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            {isRefreshing ? "Refreshing Authentication..." : "Authentication Issue"}
          </h2>
          <p className="text-gray-300 mb-4">
            {isRefreshing 
              ? "We're updating your session. Please wait..." 
              : "Your session has expired or there was an authentication error."}
          </p>
        </div>

        {!isRefreshing && (
          <div className="space-y-3">
            <Button 
              onClick={handleManualRetry}
              variant="primary"
              className="w-full"
              disabled={isRefreshing}
            >
              Try Again
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              Sign Out & Return to Login
            </Button>
          </div>
        )}

        {isRefreshing && (
          <div className="text-sm text-gray-500">
            <p>This usually takes just a moment...</p>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          If you continue to experience issues, please try signing out and back in.
        </p>
      </div>
    </div>
  );
}
