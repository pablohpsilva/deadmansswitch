/**
 * Browser Extension Connection Component
 * Handles connection to Nostr browser extensions (NIP-07)
 */

"use client";

import { useState, useEffect } from "react";
import {
  Chrome,
  Shield,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Zap,
  Download,
} from "lucide-react";
import {
  nostrBrowserService,
  NostrBrowserUtils,
  BrowserConnectionInfo,
} from "@/lib/nostr-browser";

interface BrowserConnectProps {
  onSuccess: (
    publicKey: string,
    signature: string,
    message: string,
    signedEvent?: any
  ) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export function BrowserConnect({
  onSuccess,
  onError,
  isLoading = false,
}: BrowserConnectProps) {
  const [step, setStep] = useState<
    "detect" | "install" | "connect" | "signing" | "connected"
  >("detect");
  const [connectionInfo, setConnectionInfo] = useState<BrowserConnectionInfo>({
    connected: false,
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>("");

  const browserInfo = NostrBrowserUtils.getBrowserInfo();
  const extensions = NostrBrowserUtils.getPopularExtensions();

  useEffect(() => {
    checkExtensionAvailability();
  }, []);

  const checkExtensionAvailability = () => {
    const isAvailable = nostrBrowserService.isExtensionAvailable();

    if (isAvailable) {
      // Try to restore previous connection
      const restored = nostrBrowserService.restoreConnection();
      const info = nostrBrowserService.getConnectionInfo();
      setConnectionInfo(info);

      if (restored) {
        setStep("connected");
      } else {
        setStep("connect");
      }
    } else {
      setStep("install");
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError("");

    try {
      const result = await nostrBrowserService.connect();

      if (!result.success) {
        throw new Error(result.error || "Failed to connect");
      }

      const info = nostrBrowserService.getConnectionInfo();
      setConnectionInfo(info);
      setStep("connected");

      // Now proceed with authentication
      await handleAuthentication();
    } catch (err) {
      console.error("Connection failed:", err);
      setError(err instanceof Error ? err.message : "Connection failed");
      onError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleAuthentication = async () => {
    setStep("signing");

    try {
      // Generate auth challenge
      const message = NostrBrowserUtils.generateAuthChallenge();

      // Get public key
      const publicKey = await nostrBrowserService.getPublicKey();
      if (!publicKey) {
        throw new Error("Could not retrieve public key");
      }

      // Sign authentication message
      const signResult = await nostrBrowserService.signMessage(message);

      if (!signResult.success || !signResult.signature) {
        throw new Error(signResult.error || "Failed to sign authentication");
      }

      // Success - call the callback with the signed event for better verification
      onSuccess(
        publicKey,
        signResult.signature,
        message,
        signResult.signedEvent
      );
    } catch (err) {
      console.error("Authentication failed:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
      onError(err instanceof Error ? err.message : "Authentication failed");
      setStep("connected");
    }
  };

  const handleDisconnect = () => {
    nostrBrowserService.disconnect();
    setConnectionInfo({ connected: false });
    setStep("connect");
  };

  const renderInstallStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Download className="h-6 w-6 text-orange-600" />
        </div>
        <h3 className="font-semibold text-gray-100 mb-2">
          Install a Nostr Extension
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          No Nostr browser extension detected. Install one to continue.
        </p>
      </div>

      {browserInfo.canInstallExtensions ? (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-100">
            Recommended Extensions for {browserInfo.name}:
          </h4>
          <div className="space-y-3">
            {extensions
              .filter((ext) => {
                if (browserInfo.name === "Chrome") return ext.chromeUrl;
                if (browserInfo.name === "Firefox") return ext.firefoxUrl;
                return ext.chromeUrl; // fallback
              })
              .slice(0, 3)
              .map((extension) => (
                <div
                  key={extension.name}
                  className="border rounded-lg p-3 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-100">
                        {extension.name}
                      </h5>
                      <p className="text-sm text-gray-300">
                        {extension.description}
                      </p>
                    </div>
                    <a
                      href={
                        (browserInfo.name === "Firefox"
                          ? extension.firefoxUrl
                          : extension.chromeUrl) || extension.url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors inline-flex items-center space-x-1"
                    >
                      <span>Install</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Browser Not Supported</p>
              <p>
                {browserInfo.name} doesn't support browser extensions. Please
                try using Chrome, Firefox, or Edge, or use the NWC wallet
                connection method instead.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center space-x-4 pt-4">
        <button
          onClick={checkExtensionAvailability}
          disabled={connecting}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <RefreshCw
            className={`h-4 w-4 ${connecting ? "animate-spin" : ""}`}
          />
          <span>Check Again</span>
        </button>
      </div>
    </div>
  );

  const renderConnectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Chrome className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="font-semibold text-gray-100 mb-2">Extension Detected</h3>
        <p className="text-sm text-gray-300">
          {nostrBrowserService.getSupportedFeatures().extensionName} is
          available and ready to connect.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Permission Required</p>
            <p>
              Clicking connect will request permission to access your Nostr
              keys. Your private keys never leave your browser extension.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={connecting || isLoading}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {connecting ? "Connecting..." : "Connect Extension"}
      </button>
    </div>
  );

  const renderConnectedStep = () => {
    const features = nostrBrowserService.getSupportedFeatures();

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900 mb-1">
                {features.extensionName} Connected
              </h3>
              <p className="text-sm text-green-700 mb-2">
                Extension is connected and ready for authentication
              </p>
              {connectionInfo.publicKey && (
                <p className="text-xs text-green-600 font-mono">
                  {connectionInfo.publicKey.slice(0, 16)}...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Extension Features */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-100 mb-3">Extension Features</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Can sign events</span>
              <span
                className={
                  features.canSign ? "text-green-600" : "text-gray-400"
                }
              >
                {features.canSign ? "✓" : "×"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Can encrypt/decrypt</span>
              <span
                className={
                  features.canEncrypt ? "text-green-600" : "text-gray-400"
                }
              >
                {features.canEncrypt ? "✓" : "×"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Can manage relays</span>
              <span
                className={
                  features.canGetRelays ? "text-green-600" : "text-gray-400"
                }
              >
                {features.canGetRelays ? "✓" : "×"}
              </span>
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
                  Requesting Signature
                </h3>
                <p className="text-sm text-blue-700">
                  Please approve the signing request in your extension
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAuthentication}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Authenticating..." : "Authenticate with Extension"}
          </button>
        )}

        <button
          onClick={handleDisconnect}
          className="w-full text-gray-300 hover:text-gray-200 py-2 text-sm transition-colors"
        >
          Disconnect Extension
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {step === "detect" && (
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">Detecting browser extensions...</p>
        </div>
      )}

      {step === "install" && renderInstallStep()}
      {step === "connect" && renderConnectStep()}
      {(step === "connected" || step === "signing") && renderConnectedStep()}
    </div>
  );
}
