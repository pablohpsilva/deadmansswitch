/**
 * Clean Wallet Manager Component
 * Redesigned to match the landing page design system
 */

"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Zap,
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
import { Card, Button } from "@/components/ui/card";

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  {walletInfo.alias || "Lightning Wallet"} Connected
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

            <div className="flex space-x-3 mt-3">
              <Button
                onClick={() => setView("payment")}
                variant="primary"
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                Pay with Lightning
              </Button>
              <Button onClick={handleNwcDisconnect} variant="outline" size="sm">
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Browser Extension Status */}
        {browserConnected && browserInfo && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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

            <div className="mt-3">
              <Button
                onClick={handleBrowserDisconnect}
                variant="outline"
                size="sm"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* No Connections */}
        {!nwcConnected && !browserConnected && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3 mb-4">
              <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  No Wallets Connected
                </p>
                <p className="text-sm text-gray-600">
                  Connect a wallet for Lightning payments
                </p>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => setView("connect-nwc")}
                variant="primary"
                size="sm"
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Connect Lightning Wallet
              </Button>
              <Button
                onClick={() => setView("connect-browser")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Chrome className="h-4 w-4 mr-2" />
                Connect Browser Extension
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-900 mb-3">
          Available Payment Methods
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">Lightning Network</p>
                <p className="text-sm text-gray-600">Fast, low-fee payments</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {nwcConnected ? "Connected" : "Connect wallet"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Credit Card</p>
                <p className="text-sm text-gray-600">
                  Traditional payment via Stripe
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-500">Available</span>
          </div>
        </div>
      </div>

      {/* Lightning Benefits */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-900 mb-3">
          Why Choose Lightning?
        </h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-center">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
            Instant payments (seconds vs hours)
          </li>
          <li className="flex items-center">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
            Very low fees (fractions of a cent)
          </li>
          <li className="flex items-center">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
            Private and secure
          </li>
          <li className="flex items-center">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
            No intermediaries needed
          </li>
        </ul>

        <div className="mt-4">
          <a
            href="https://lightning.network/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
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
          <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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
              <p className="text-sm text-gray-600">$15 per year</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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
              <p className="text-sm text-gray-600">$60 one-time</p>
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
    <Card className={className}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Wallet className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Wallet Manager
          </h2>
          <p className="text-sm text-gray-600">
            Connect and manage your wallets
          </p>
        </div>
      </div>

      {view === "status" && renderWalletStatus()}
      {view === "connect-nwc" && renderNwcConnect()}
      {view === "connect-browser" && renderBrowserConnect()}
      {view === "payment" && renderPayment()}
    </Card>
  );
}
