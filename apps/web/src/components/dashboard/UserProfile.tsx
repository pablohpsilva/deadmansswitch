"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface User {
  id: string;
  email?: string;
  authType: "email" | "nostr";
  nostrPublicKey?: string;
  tier: string;
  lastCheckIn?: Date;
  hasNostrKeys: boolean;
  canExportKeys: boolean;
  createdAt?: Date;
}

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  const [showExportKeys, setShowExportKeys] = useState(false);
  const [exportedKeys, setExportedKeys] = useState<{
    privateKey: string;
    publicKey: string;
    warning: string;
    recommendation: string;
  } | null>(null);

  const checkInMutation = trpc.auth.checkIn.useMutation({
    onSuccess: () => {
      alert("✅ Check-in successful!");
    },
    onError: (error) => {
      console.error("Check-in failed:", error);
      alert("❌ Check-in failed. Please try again.");
    },
  });

  const exportKeysMutation = trpc.auth.exportNostrKeys.useMutation({
    onSuccess: (data) => {
      setExportedKeys(data);
      setShowExportKeys(false);
    },
    onError: (error) => {
      console.error("Export keys failed:", error);
      alert(`Failed to export keys: ${error.message}`);
    },
  });

  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  const handleExportKeys = () => {
    if (
      confirm(
        "⚠️ WARNING: This will permanently remove your Nostr keys from our servers. " +
          "Make sure you have a secure way to store them. Continue?"
      )
    ) {
      exportKeysMutation.mutate();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("📋 Copied to clipboard!");
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-medium">
            {user.email ? user.email[0].toUpperCase() : "👤"}
          </span>
        </div>

        <div className="text-sm">
          <p className="font-medium text-gray-900">
            {user.email || "Nostr User"}
          </p>
          <div className="flex items-center space-x-2 text-gray-500">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                user.authType === "email"
                  ? "bg-green-100 text-green-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {user.authType === "email" ? "📧 Email" : "🔗 Nostr"}
            </span>

            {user.lastCheckIn && (
              <span className="text-xs">
                Last: {formatDate(user.lastCheckIn)}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2 ml-4">
          <button
            onClick={handleCheckIn}
            disabled={checkInMutation.isLoading}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
            title="Update your check-in status"
          >
            {checkInMutation.isLoading ? "⏳" : "✅"} Check In
          </button>

          {user.canExportKeys && (
            <button
              onClick={() => setShowExportKeys(!showExportKeys)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              title="Export your Nostr keys"
            >
              🔑 Keys
            </button>
          )}
        </div>
      </div>

      {/* Export Keys Section */}
      {showExportKeys && user.canExportKeys && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            🔑 Export Nostr Keys
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            Export your Nostr keys to use with other clients. Keys will be
            permanently removed from our servers.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowExportKeys(false)}
              className="flex-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExportKeys}
              disabled={exportKeysMutation.isLoading}
              className="flex-1 px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {exportKeysMutation.isLoading ? "Exporting..." : "⚠️ Export Now"}
            </button>
          </div>
        </div>
      )}

      {/* Export Keys Modal */}
      {exportedKeys && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  🔑 Your Nostr Keys
                </h3>
                <button
                  onClick={() => setExportedKeys(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">
                    {exportedKeys.warning}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Private Key (Keep this secret!)
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={exportedKeys.privateKey}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(exportedKeys.privateKey)}
                        className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-300"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Public Key
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={exportedKeys.publicKey}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(exportedKeys.publicKey)}
                        className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-300"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>💡 {exportedKeys.recommendation}</strong>
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setExportedKeys(null)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    I've Saved My Keys
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
