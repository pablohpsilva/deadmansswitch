/**
 * Reusable Suspense wrapper with error boundaries for SSR
 */

import { Suspense, ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export function SuspenseWrapper({
  children,
  fallback = <DefaultSkeleton />,
  errorFallback = <DefaultErrorFallback />,
  onError,
}: SuspenseWrapperProps) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="p-4">
          {errorFallback || (
            <DefaultErrorFallback error={error} reset={resetErrorBoundary} />
          )}
        </div>
      )}
      onError={onError}
    >
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// Default loading skeleton
function DefaultSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-8 w-48 rounded mb-4" />
      <div className="space-y-3">
        <div className="bg-gray-200 h-4 rounded" />
        <div className="bg-gray-200 h-4 rounded w-3/4" />
        <div className="bg-gray-200 h-4 rounded w-1/2" />
      </div>
    </div>
  );
}

// Default error fallback
function DefaultErrorFallback({
  error,
  reset,
}: {
  error?: Error;
  reset?: () => void;
}) {
  return (
    <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-500 text-2xl mb-2">⚠️</div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Something went wrong
      </h3>
      <p className="text-red-700 text-sm mb-4">
        {error?.message || "An unexpected error occurred"}
      </p>
      {reset && (
        <button
          onClick={reset}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// Specialized wrappers for different components
export function DashboardSuspenseWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SuspenseWrapper
      fallback={
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      }
      onError={(error) => {
        console.error("Dashboard error:", error);
        // Could send to error tracking service
      }}
    >
      {children}
    </SuspenseWrapper>
  );
}

export function EmailSuspenseWrapper({ children }: { children: ReactNode }) {
  return (
    <SuspenseWrapper
      fallback={
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      }
      onError={(error) => {
        console.error("Email component error:", error);
      }}
    >
      {children}
    </SuspenseWrapper>
  );
}
