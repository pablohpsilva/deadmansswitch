"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/card";

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

interface UserProfileSimpleProps {
  user: User;
}

export function UserProfileSimple({ user }: UserProfileSimpleProps) {
  const [showExportKeys, setShowExportKeys] = useState(false);
  const [exportedKeys, setExportedKeys] = useState<{
    privateKey: string;
    publicKey: string;
    warning: string;
    recommendation: string;
  } | null>(null);

  const checkInMutation = (trpc as any).auth.checkIn.useMutation({
    onSuccess: () => {
      alert("Check-in successful!");
    },
    onError: (error: any) => {
      console.error("Check-in failed:", error);
      alert("Check-in failed. Please try again.");
    },
  });

  const exportKeysMutation = (trpc as any).auth.exportNostrKeys.useMutation({
    onSuccess: (data: any) => {
      setExportedKeys(data);
      setShowExportKeys(false);
    },
    onError: (error: any) => {
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
        "WARNING: This will permanently remove your Nostr keys from our servers. " +
          "Make sure you have a secure way to store them. Continue?"
      )
    ) {
      exportKeysMutation.mutate();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-3">
        {/* Simple user info without avatar */}
        <div className="text-right">
          <p className="text-sm font-medium text-gray-100">
            {user.email || "Nostr User"}
          </p>
          <p className="text-xs text-gray-500">
            {user.authType === "email" ? "Email" : "Nostr"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleCheckIn}
            disabled={checkInMutation.isLoading}
            variant="outline"
            size="sm"
          >
            {checkInMutation.isLoading ? "..." : "Check In"}
          </Button>

          {user.canExportKeys && (
            <Button
              onClick={() => setShowExportKeys(!showExportKeys)}
              variant="outline"
              size="sm"
            >
              Export Keys
            </Button>
          )}
        </div>
      </div>

      {/* Export Keys Section */}
      {showExportKeys && user.canExportKeys && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 rounded-lg shadow-lg border z-50 p-4">
          <h4 className="font-medium text-gray-100 mb-2">Export Nostr Keys</h4>
          <p className="text-xs text-gray-300 mb-3">
            Export your Nostr keys to use with other clients. Keys will be
            permanently removed from our servers.
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowExportKeys(false)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportKeys}
              disabled={exportKeysMutation.isLoading}
              variant="primary"
              size="sm"
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {exportKeysMutation.isLoading ? "Exporting..." : "Export Now"}
            </Button>
          </div>
        </div>
      )}

      {/* Export Keys Modal */}
      {exportedKeys && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-100">
                  Your Nostr Keys
                </h3>
                <button
                  onClick={() => setExportedKeys(null)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  ×
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
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Private Key (Keep this secret!)
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={exportedKeys.privateKey}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(exportedKeys.privateKey)}
                        className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-600 rounded-r-lg hover:bg-gray-300"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Public Key
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={exportedKeys.publicKey}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(exportedKeys.publicKey)}
                        className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-600 rounded-r-lg hover:bg-gray-300"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>{exportedKeys.recommendation}</strong>
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setExportedKeys(null)}
                    variant="primary"
                  >
                    I've Saved My Keys
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
