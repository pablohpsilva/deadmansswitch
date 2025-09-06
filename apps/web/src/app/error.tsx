"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Global error boundary for SSR errors
export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleTryAgain = () => {
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Error Icon */}
          <div className="text-6xl mb-4">💥</div>

          <h1 className="text-2xl font-bold text-gray-100 mb-4">
            Something went wrong
          </h1>

          <p className="text-gray-300 mb-6">
            We're sorry, but something unexpected happened. Our team has been
            notified.
          </p>

          {/* Error details in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                Development Error Details:
              </h3>
              <p className="text-xs text-red-700 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleTryAgain}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Try Again
            </button>

            <button
              onClick={handleGoHome}
              className="w-full border border-gray-600 text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
            >
              Go to Homepage
            </button>
          </div>

          {/* Contact support */}
          <div className="mt-6 pt-6 border-t text-sm text-gray-500">
            <p>
              If this problem persists, please{" "}
              <a
                href="mailto:support@deadmansswitch.com"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
