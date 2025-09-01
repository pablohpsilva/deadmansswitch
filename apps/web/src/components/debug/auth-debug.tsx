"use client";

import { useState } from "react";
import { trpcClient } from "@/lib/trpc";

export function AuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAuth = async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      // Get token from localStorage
      const token = localStorage.getItem("auth_token");

      // Try to call the auth.me endpoint directly
      let authResult = null;
      let error = null;

      try {
        authResult = await (trpcClient as any).auth.me.query();
      } catch (err) {
        error = err;
      }

      // Try to decode JWT token payload
      let decodedToken = null;
      if (token && token.split(".").length === 3) {
        try {
          const payload = token.split(".")[1];
          decodedToken = JSON.parse(atob(payload));
        } catch (e) {
          decodedToken = { decodingError: "Failed to decode token payload" };
        }
      }

      setDebugInfo({
        token: token
          ? {
              exists: true,
              length: token.length,
              preview: `${token.substring(0, 30)}...`,
              isJWT: token.split(".").length === 3,
              decoded: decodedToken,
            }
          : { exists: false },
        authResult,
        error: error
          ? {
              message: (error as any).message,
              name: (error as any).name,
              code: (error as any).code || "Unknown",
              cause: (error as any).cause,
            }
          : null,
        networkInfo: {
          frontendUrl: window.location.origin,
          backendUrl:
            process.env.NODE_ENV === "development"
              ? "http://localhost:3001"
              : "https://api.deadmansswitch.com",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setDebugInfo({
        error: {
          message: (err as any).message || "Unknown error",
          stack: (err as any).stack,
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const clearToken = () => {
    localStorage.removeItem("auth_token");
    setDebugInfo(null);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Auth Debug</h3>
        <button
          onClick={() => setDebugInfo(null)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <button
          onClick={checkAuth}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check Auth Status"}
        </button>

        <button
          onClick={clearToken}
          className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
        >
          Clear Token
        </button>
      </div>

      {debugInfo && (
        <div className="mt-4 bg-gray-50 rounded p-3 text-xs">
          <pre className="whitespace-pre-wrap overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
