/**
 * Wallet Connection Component
 * Handles NWC wallet connection flow for authentication
 */

"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { nwcService, NWCUtils } from "@/lib/nwc";

interface WalletConnectProps {
  onSuccess: (publicKey: string, signature: string, message: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export function WalletConnect({
  onSuccess,
  onError,
  isLoading = false,
}: WalletConnectProps) {
  const [connectionUri, setConnectionUri] = useState("");
  const [showUri, setShowUri] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [step, setStep] = useState<"input" | "connecting" | "signing">("input");

  useEffect(() => {
    // Try to restore previous connection
    const initConnection = async () => {
      const restored = await nwcService.restoreConnection();
      if (restored) {
        setConnected(true);
        const info = await nwcService.getWalletInfo();
        setWalletInfo(info);
      }
    };

    initConnection();
  }, []);

  const handleConnect = async () => {
    if (!connectionUri.trim()) {
      onError("Please enter a connection string");
      return;
    }

    setConnecting(true);
    setStep("connecting");

    try {
      const result = await nwcService.connectWallet(connectionUri.trim());

      if (!result.success) {
        throw new Error(result.error || "Failed to connect wallet");
      }

      setConnected(true);
      const info = await nwcService.getWalletInfo();
      setWalletInfo(info);

      // Now proceed with authentication
      await handleAuthentication();
    } catch (error) {
      console.error("Connection failed:", error);
      onError(error instanceof Error ? error.message : "Connection failed");
      setStep("input");
    } finally {
      setConnecting(false);
    }
  };

  const handleAuthentication = async () => {
    setStep("signing");

    try {
      // Get public key from wallet
      const publicKey = await nwcService.getPublicKey();
      if (!publicKey) {
        throw new Error("Could not retrieve public key from wallet");
      }

      // Generate auth challenge
      const message = NWCUtils.generateAuthChallenge();

      // Create Nostr event for signing
      const authEvent = {
        kind: 22242, // NIP-42 auth event kind
        created_at: Math.floor(Date.now() / 1000),
        tags: [["challenge", message]],
        content: `Login to Dead Man's Switch at ${new Date().toISOString()}`,
        pubkey: publicKey,
      };

      // Sign the event
      const signResult = await nwcService.signNostrEvent(authEvent);

      if (!signResult.success || !signResult.signature) {
        throw new Error(
          signResult.error || "Failed to sign authentication event"
        );
      }

      // Success - call the callback
      onSuccess(publicKey, signResult.signature, message);
    } catch (error) {
      console.error("Authentication failed:", error);
      onError(error instanceof Error ? error.message : "Authentication failed");
      setStep("input");
    }
  };

  const handleDisconnect = async () => {
    await nwcService.disconnectWallet();
    setConnected(false);
    setWalletInfo(null);
    setConnectionUri("");
    setStep("input");
  };

  if (connected && walletInfo) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900 mb-1">
                Wallet Connected
              </h3>
              <p className="text-sm text-green-700 mb-2">
                {walletInfo.alias || "NWC Wallet"} is ready for authentication
              </p>
              {walletInfo.balance && (
                <p className="text-sm text-green-600">
                  Balance: {walletInfo.balance.toLocaleString()} sats
                </p>
              )}
            </div>
          </div>
        </div>

        {step === "signing" ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">
                  Signing Authentication
                </h3>
                <p className="text-sm text-blue-700">
                  Please approve the signing request in your wallet
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAuthentication}
            disabled={isLoading || step === "signing"}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Authenticating..." : "Authenticate with Wallet"}
          </button>
        )}

        <button
          onClick={handleDisconnect}
          className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm transition-colors"
        >
          Disconnect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Wallet className="h-6 w-6 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Connect Your Nostr Wallet
        </h3>
        <p className="text-sm text-gray-600">
          Connect using Nostr Wallet Connect (NWC) for secure authentication
        </p>
      </div>

      {step === "connecting" ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">
                Connecting to Wallet
              </h3>
              <p className="text-sm text-blue-700">
                Establishing secure connection...
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <label
              htmlFor="connection-uri"
              className="block text-sm font-medium text-gray-700"
            >
              Wallet Connection String
            </label>
            <div className="relative">
              <input
                id="connection-uri"
                type={showUri ? "text" : "password"}
                value={connectionUri}
                onChange={(e) => setConnectionUri(e.target.value)}
                placeholder="nostr+walletconnect://..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowUri(!showUri)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showUri ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Get this connection string from your NWC-compatible wallet (Alby,
              Zeus, etc.)
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting || !connectionUri.trim() || isLoading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </>
      )}

      {/* Help section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-gray-600" />
          How to get your connection string
        </h4>
        <div className="text-sm text-gray-600 space-y-2">
          <p>Popular NWC-compatible wallets:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Alby:</strong> Go to Settings → Wallet → Connection
              <a
                href="https://getalby.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center ml-1 text-purple-600 hover:text-purple-800"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <strong>Zeus:</strong> Settings → Lightning → Nostr Wallet Connect
            </li>
            <li>
              <strong>Mutiny:</strong> Settings → Connections → Nostr Wallet
              Connect
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
