/**
 * Wallet Manager Component
 * Provides wallet connection and management features in the dashboard
 */

"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  CreditCard,
  Chrome,
} from "lucide-react";
import { nwcService, WalletInfo } from "@/lib/nwc";
import {
  nostrBrowserService,
  BrowserConnectionInfo,
} from "@/lib/nostr-browser";
import { WalletConnect } from "../auth/wallet-connect";
import { BrowserConnect } from "../auth/browser-connect";
import { LightningPayment } from "./LightningPayment";

type WalletView = "status" | "connect-nwc" | "connect-browser" | "payment";

interface WalletManagerProps {
  className?: string;
}

export function WalletManager({ className = "" }: WalletManagerProps) {
  const [view, setView] = useState<WalletView>("status");
  const [nwcConnected, setNwcConnected] = useState(false);
  const [browserConnected, setBrowserConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [browserInfo, setBrowserInfo] = useState<BrowserConnectionInfo | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [paymentTier, setPaymentTier] = useState<"premium" | "lifetime">(
    "premium"
  );

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    setLoading(true);
    try {
      // Check NWC connection
      const nwcIsConnected = nwcService.connected;
      setNwcConnected(nwcIsConnected);

      if (nwcIsConnected) {
        const info = await nwcService.getWalletInfo();
        setWalletInfo(info);
      }

      // Check browser extension connection
      const browserRestored = nostrBrowserService.restoreConnection();
      setBrowserConnected(browserRestored);

      if (browserRestored) {
        const info = nostrBrowserService.getConnectionInfo();
        setBrowserInfo(info);
      }
    } catch (err) {
      console.error("Failed to check wallet status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNwcDisconnect = async () => {
    try {
      await nwcService.disconnectWallet();
      setNwcConnected(false);
      setWalletInfo(null);
      setView("status");
    } catch (err) {
      console.error("Failed to disconnect NWC wallet:", err);
      setError("Failed to disconnect wallet");
    }
  };

  const handleBrowserDisconnect = () => {
    nostrBrowserService.disconnect();
    setBrowserConnected(false);
    setBrowserInfo(null);
    setView("status");
  };

  const handleNwcConnected = () => {
    setView("status");
    checkWalletStatus();
  };

  const handleBrowserConnected = () => {
    setView("status");
    checkWalletStatus();
  };

  const renderWalletStatus = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Wallet Connection</h3>
          <button
            onClick={checkWalletStatus}
            disabled={loading}
            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* NWC Connection Status */}
        {nwcConnected && walletInfo && (
          <div className="space-y-3 border-b pb-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  {walletInfo.alias || "NWC Wallet"} Connected
                </p>
                <p className="text-sm text-green-700">
                  Ready for Lightning payments
                </p>
                {walletInfo.balance !== undefined && (
                  <p className="text-sm text-gray-600 mt-1">
                    Balance: {walletInfo.balance.toLocaleString()} sats
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setView("payment")}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span>Pay with Wallet</span>
              </button>
              <button
                onClick={handleNwcDisconnect}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 border rounded-lg text-sm transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Browser Extension Status */}
        {browserConnected && browserInfo && (
          <div className="space-y-3 border-b pb-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  {browserInfo.extensionName || "Browser Extension"} Connected
                </p>
                <p className="text-sm text-green-700">
                  Ready for Nostr signing
                </p>
                {browserInfo.publicKey && (
                  <p className="text-xs text-gray-600 font-mono mt-1">
                    {browserInfo.publicKey.slice(0, 16)}...
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleBrowserDisconnect}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 border rounded-lg text-sm transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* No Connections */}
        {!nwcConnected && !browserConnected && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">No Connections</p>
                <p className="text-sm text-gray-600">
                  Connect a Nostr wallet or browser extension
                </p>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setView("connect-nwc")}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span>Connect NWC Wallet</span>
              </button>
              <button
                onClick={() => setView("connect-browser")}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                <Chrome className="h-4 w-4" />
                <span>Connect Browser Extension</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Payment Options */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">Lightning Network</p>
                <p className="text-sm text-gray-600">
                  Fast, low-fee Bitcoin payments
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {connected ? "Connected" : "Connect wallet"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Credit Card</p>
                <p className="text-sm text-gray-600">
                  Traditional payment via Stripe
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          🚀 Why use Lightning?
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Instant payments (seconds vs hours)</li>
          <li>• Very low fees (fractions of a cent)</li>
          <li>• Private and secure</li>
          <li>• No intermediaries needed</li>
        </ul>
        <div className="mt-3">
          <a
            href="https://lightning.network/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-blue-700 hover:text-blue-800 text-sm font-medium"
          >
            <span>Learn more about Lightning</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );

  const renderNwcConnect = () => (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setView("status")}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
        >
          ← Back to Wallet Manager
        </button>
      </div>

      <WalletConnect
        onSuccess={handleNwcConnected}
        onError={(error) => {
          setError(error);
          setView("status");
        }}
        isLoading={loading}
      />
    </div>
  );

  const renderBrowserConnect = () => (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setView("status")}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
        >
          ← Back to Wallet Manager
        </button>
      </div>

      <BrowserConnect
        onSuccess={(publicKey, signature, message, signedEvent) => {
          // For wallet manager, we just want to establish connection, not authenticate
          handleBrowserConnected();
        }}
        onError={(error) => {
          setError(error);
          setView("status");
        }}
        isLoading={loading}
      />
    </div>
  );

  const renderPayment = () => (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setView("status")}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
        >
          ← Back to Wallet
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Choose Upgrade Plan
        </h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="tier"
              value="premium"
              checked={paymentTier === "premium"}
              onChange={(e) => setPaymentTier(e.target.value as "premium")}
              className="text-blue-600"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Premium (1 Year)</p>
              <p className="text-sm text-gray-600">$15 • ~30,000 sats</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="tier"
              value="lifetime"
              checked={paymentTier === "lifetime"}
              onChange={(e) => setPaymentTier(e.target.value as "lifetime")}
              className="text-blue-600"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Lifetime Access</p>
              <p className="text-sm text-gray-600">$60 • ~120,000 sats</p>
            </div>
          </label>
        </div>
      </div>

      <LightningPayment
        tier={paymentTier}
        onSuccess={() => {
          setView("status");
          // Could trigger a refresh of user data here
        }}
        onCancel={() => setView("status")}
      />
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Wallet className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Wallet Manager
          </h2>
          <p className="text-sm text-gray-600">
            Connect and manage your Nostr wallets and extensions
          </p>
        </div>
      </div>

      {view === "status" && renderWalletStatus()}
      {view === "connect-nwc" && renderNwcConnect()}
      {view === "connect-browser" && renderBrowserConnect()}
      {view === "payment" && renderPayment()}
    </div>
  );
}
