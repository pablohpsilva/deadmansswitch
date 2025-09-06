"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Mail,
  Zap,
  ArrowLeft,
  Chrome,
  Key,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthMutations } from "@/hooks/useAuthMutations";
import { WalletConnect } from "./wallet-connect";
import { BrowserConnect } from "./browser-connect";
import { generateSecretKey, getPublicKey } from "nostr-tools";

// Auth flow types
type AuthMethod = "email" | "browser" | "nostr";
type AuthStep =
  | "method"
  | "email-input"
  | "otp-verification"
  | "nostr-connection"
  | "nostr-key-generation"
  | "key-validation"
  | "browser-extension"
  | "nostr-wallet"
  | "email-for-nostr";

interface AuthState {
  method: AuthMethod | null;
  step: AuthStep;
  email: string;
  otp: string;
  userExists: boolean | null;
  hasNostrWallet: boolean | null;
  generatedKeys: {
    privateKey: string;
    publicKey: string;
  } | null;
  nostrPublicKey: string | null; // Store public key from browser/wallet auth
}

export function LoginClient() {
  const router = useRouter();

  // New state management
  const [authState, setAuthState] = useState<AuthState>({
    method: null,
    step: "method",
    email: "",
    otp: "",
    userExists: null,
    hasNostrWallet: null,
    generatedKeys: null,
    nostrPublicKey: null,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [validationInput, setValidationInput] = useState({
    firstTen: "",
    lastFive: "",
  });
  const [checklist, setChecklist] = useState({
    savedPrivateKey: false,
    understoodSecurity: false,
    confirmedBackup: false,
  });

  const {
    requestEmailAuth,
    verifyEmailOTP,
    completeNostrRegistration,
    loginWithNostr,
    checkAuthStatus,
    isAuthenticating,
  } = useAuthMutations();

  // Check if user is already authenticated on component mount
  React.useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Helper function to update auth state
  const updateAuthState = (updates: Partial<AuthState>) => {
    setAuthState((prev) => ({ ...prev, ...updates }));
  };

  const handleEmailFlow = async () => {
    if (authState.step === "email-input") {
      // Validate email
      if (!authState.email || !/\S+@\S+\.\S+/.test(authState.email)) {
        setErrors({ email: "Please enter a valid email address" });
        return;
      }

      setErrors({});
      try {
        // Check if user exists and send OTP
        const result = await requestEmailAuth.mutateAsync({
          email: authState.email,
        });
        updateAuthState({
          userExists: result.userExists,
          step: "otp-verification",
        });
      } catch (error) {
        setErrors({
          email:
            error instanceof Error
              ? error.message
              : "Failed to send login code",
        });
      }
    } else if (authState.step === "otp-verification") {
      // Validate OTP
      if (!authState.otp.trim()) {
        setErrors({ otp: "Please enter the login code" });
        return;
      }

      setErrors({});
      try {
        // Check if this is a new user coming from browser/wallet flow
        if (!authState.userExists && authState.nostrPublicKey) {
          // Use completeNostrRegistration for browser/wallet flow
          await completeNostrRegistration.mutateAsync({
            publicKey: authState.nostrPublicKey,
            email: authState.email,
            otp: authState.otp,
          });
          return; // Navigation handled by the mutation
        }

        // Use verifyEmailOTP for email flow
        const result = await verifyEmailOTP.mutateAsync({
          email: authState.email,
          otp: authState.otp,
          isNewUser: !authState.userExists,
          nostrKeys: authState.generatedKeys
            ? {
                publicKey: authState.generatedKeys.publicKey,
                privateKey: authState.generatedKeys.privateKey,
              }
            : undefined,
        });

        // Handle the response based on user status
        if (result.requiresNostrConnection) {
          // Existing users need to connect Nostr
          updateAuthState({ step: "nostr-connection" });
          return;
        }

        if (result.token) {
          // New user completed successfully - navigation handled by mutation
          return;
        }

        // For new users without keys generated yet
        updateAuthState({ step: "nostr-key-generation" });
      } catch (error) {
        setErrors({
          otp: error instanceof Error ? error.message : "Invalid login code",
        });
      }
    }
  };

  const handleBrowserAuth = async () => {
    updateAuthState({ method: "browser", step: "browser-extension" });
    setErrors({});
  };

  const handleNostrAuth = async () => {
    updateAuthState({ method: "nostr", step: "nostr-wallet" });
    setErrors({});
  };

  const generateNostrKeys = () => {
    try {
      const secretKey = generateSecretKey();
      const privateKeyHex = Buffer.from(secretKey).toString("hex");
      const publicKey = getPublicKey(secretKey);

      updateAuthState({
        generatedKeys: { privateKey: privateKeyHex, publicKey },
        step: "key-validation",
      });
    } catch (error) {
      setErrors({
        generation: "Failed to generate keys. Please try again.",
      });
    }
  };

  const validateKeys = () => {
    if (!authState.generatedKeys) return;

    const { privateKey } = authState.generatedKeys;
    const expectedFirstTen = privateKey.slice(0, 10);
    const expectedLastFive = privateKey.slice(-5);

    const firstTenValid = validationInput.firstTen === expectedFirstTen;
    const lastFiveValid = validationInput.lastFive === expectedLastFive;
    const checklistValid = Object.values(checklist).every(Boolean);

    if (!firstTenValid) {
      setErrors({ validation: "First 10 digits don't match" });
      return;
    }

    if (!lastFiveValid) {
      setErrors({ validation: "Last 5 digits don't match" });
      return;
    }

    if (!checklistValid) {
      setErrors({ validation: "Please complete all checklist items" });
      return;
    }

    // All validation passed - complete registration
    completeRegistration();
  };

  const completeRegistration = async () => {
    if (!authState.generatedKeys || !authState.otp) return;

    try {
      // User already verified OTP in previous step, so we use verifyEmailOTP
      await verifyEmailOTP.mutateAsync({
        email: authState.email,
        otp: authState.otp,
        isNewUser: true,
        nostrKeys: {
          publicKey: authState.generatedKeys.publicKey,
          privateKey: authState.generatedKeys.privateKey,
        },
      });
    } catch (error) {
      setErrors({
        registration:
          error instanceof Error ? error.message : "Registration failed",
      });
    }
  };

  const handleWalletSuccess = async (
    publicKey: string,
    signature: string,
    message: string
  ) => {
    try {
      const result = await loginWithNostr.mutateAsync({
        publicKey,
        signature,
        message,
      });

      // If user doesn't exist, ask for email and store the public key
      if (!result.userExists) {
        updateAuthState({
          step: "email-for-nostr",
          nostrPublicKey: publicKey,
        });
      }
      // Navigation handled by the mutation's onSuccess for existing users
    } catch (error) {
      setErrors({
        nostr: error instanceof Error ? error.message : "Authentication failed",
      });
    }
  };

  const handleBrowserSuccess = async (
    publicKey: string,
    signature: string,
    message: string,
    signedEvent?: any
  ) => {
    try {
      const result = await loginWithNostr.mutateAsync({
        publicKey,
        signature,
        message,
        signedEvent,
      });

      // If user doesn't exist, ask for email and store the public key
      if (!result.userExists) {
        updateAuthState({
          step: "email-for-nostr",
          nostrPublicKey: publicKey,
        });
      }
      // Navigation handled by the mutation's onSuccess for existing users
    } catch (error) {
      setErrors({
        browser:
          error instanceof Error ? error.message : "Authentication failed",
      });
    }
  };

  const handleBrowserError = (error: string) => {
    setErrors({ browser: error });
  };

  const handleWalletError = (error: string) => {
    setErrors({ nostr: error });
  };

  return (
    <div className="pt-16 sm:pt-20 pb-8 sm:pb-16 px-4 sm:px-6">
      <div className="max-w-sm sm:max-w-md mx-auto">
        <div className="bg-gray-800 rounded-lg sm:rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-gray-300">
              {authState.step === "method" &&
                "Choose how you'd like to sign in"}
              {authState.step === "email-input" && "Enter your email address"}
              {authState.step === "otp-verification" &&
                "Check your email for the login code"}
              {authState.step === "nostr-connection" &&
                "Connect your Nostr account"}
              {authState.step === "nostr-key-generation" &&
                "Set up your Nostr keys"}
              {authState.step === "key-validation" &&
                "Verify you've saved your keys"}
              {authState.step === "browser-extension" &&
                "Connect via browser extension"}
              {authState.step === "nostr-wallet" && "Connect your Nostr wallet"}
              {authState.step === "email-for-nostr" &&
                "Provide your email to complete registration"}
            </p>
          </div>

          {/* Authentication Methods */}
          {authState.step === "method" && (
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => {
                  updateAuthState({ method: "email", step: "email-input" });
                }}
                className="w-full p-3 sm:p-4 border-2 border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      Email
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      Get a secure login code via email
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleBrowserAuth}
                disabled={isAuthenticating}
                className="w-full p-3 sm:p-4 border-2 border-gray-600 rounded-lg hover:border-green-500 hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Chrome className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      Browser Extension
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      Connect with your Nostr browser extension
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleNostrAuth}
                disabled={isAuthenticating}
                className="w-full p-3 sm:p-4 border-2 border-gray-600 rounded-lg hover:border-purple-500 hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      Nostr Wallet
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      Connect with your Nostr wallet
                    </p>
                  </div>
                </div>
              </button>

              <div className="text-center pt-4">
                <p className="text-xs sm:text-sm text-gray-300">
                  New here?{" "}
                  <span className="text-blue-400 font-semibold">
                    Just choose a method above to get started!
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Email Input */}
          {authState.step === "email-input" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => updateAuthState({ step: "method" })}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Back</span>
              </button>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={authState.email}
                  onChange={(e) => updateAuthState({ email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {errors.email && (
                <div className="text-red-400 text-sm">{errors.email}</div>
              )}

              <button
                onClick={handleEmailFlow}
                disabled={isAuthenticating || !authState.email}
                className={cn(
                  "w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-colors text-sm sm:text-base",
                  "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                )}
              >
                {requestEmailAuth.isPending
                  ? "Sending Code..."
                  : "Send Login Code"}
              </button>
            </div>
          )}

          {/* OTP Verification */}
          {authState.step === "otp-verification" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => updateAuthState({ step: "email-input" })}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Back</span>
              </button>

              <div className="bg-blue-900/30 border border-blue-700 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-200">
                  We've sent a temporary login code to{" "}
                  <strong className="text-white">{authState.email}</strong>. The
                  code is valid for 24 hours and can only be used once.
                </p>
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Login Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={authState.otp}
                  onChange={(e) => updateAuthState({ otp: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-center text-base sm:text-lg placeholder-gray-400"
                  placeholder="Enter the code from your email"
                  required
                />
              </div>

              {errors.otp && (
                <div className="text-red-400 text-sm">{errors.otp}</div>
              )}

              <button
                onClick={handleEmailFlow}
                disabled={isAuthenticating || !authState.otp}
                className={cn(
                  "w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-colors text-sm sm:text-base",
                  "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                )}
              >
                {verifyEmailOTP.isPending ? "Verifying..." : "Verify Code"}
              </button>

              <button
                onClick={() => {
                  updateAuthState({ step: "email-input", otp: "" });
                  setErrors({});
                }}
                disabled={isAuthenticating}
                className="w-full py-2 text-xs sm:text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Need a new code? Click here
              </button>
            </div>
          )}

          {/* Nostr Connection for existing users */}
          {authState.step === "nostr-connection" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => updateAuthState({ step: "otp-verification" })}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Back</span>
              </button>

              <div className="bg-blue-900/30 border border-blue-700 p-3 sm:p-4 rounded-lg mb-6">
                <p className="text-xs sm:text-sm text-blue-200">
                  Please connect your Nostr account to complete the login
                  process.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBrowserAuth}
                  className="w-full p-3 sm:p-4 border-2 border-gray-600 rounded-lg hover:border-green-500 hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Chrome className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        Browser Extension
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Connect with Nostr extension
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleNostrAuth}
                  className="w-full p-3 sm:p-4 border-2 border-gray-600 rounded-lg hover:border-purple-500 hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        Nostr Wallet
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Connect external wallet
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Browser Extension Connection */}
          {authState.step === "browser-extension" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => {
                  const backStep =
                    authState.method === "browser"
                      ? "method"
                      : "nostr-connection";
                  updateAuthState({ step: backStep });
                }}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Back</span>
              </button>

              <BrowserConnect
                onSuccess={handleBrowserSuccess}
                onError={handleBrowserError}
                isLoading={isAuthenticating}
              />

              {errors.browser && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 sm:p-4">
                  <div className="text-red-200 text-sm">{errors.browser}</div>
                </div>
              )}
            </div>
          )}

          {/* Nostr Wallet Connection */}
          {authState.step === "nostr-wallet" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => {
                  const backStep =
                    authState.method === "nostr"
                      ? "method"
                      : "nostr-connection";
                  updateAuthState({ step: backStep });
                }}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Back</span>
              </button>

              <WalletConnect
                onSuccess={handleWalletSuccess}
                onError={handleWalletError}
                isLoading={isAuthenticating}
              />

              {errors.nostr && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 sm:p-4">
                  <div className="text-red-200 text-sm">{errors.nostr}</div>
                </div>
              )}
            </div>
          )}

          {/* Nostr Key Generation */}
          {authState.step === "nostr-key-generation" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => updateAuthState({ step: "otp-verification" })}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Back</span>
              </button>

              <div className="bg-yellow-900/30 border border-yellow-700 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-yellow-200">
                  Do you already have a Nostr account? If yes, use the browser
                  extension or wallet options. If not, we'll generate secure
                  keys for you.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBrowserAuth}
                  className="w-full p-3 sm:p-4 border-2 border-gray-600 rounded-lg hover:border-green-500 hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Chrome className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        I have a browser extension
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Connect existing Nostr extension
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleNostrAuth}
                  className="w-full p-3 sm:p-4 border-2 border-gray-600 rounded-lg hover:border-purple-500 hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        I have a Nostr wallet
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Connect external wallet
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={generateNostrKeys}
                  className="w-full p-3 sm:p-4 border-2 border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Key className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        Generate new keys for me
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Create a new secure Nostr identity
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {errors.generation && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 sm:p-4">
                  <div className="text-red-200 text-sm">
                    {errors.generation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key Validation */}
          {authState.step === "key-validation" && authState.generatedKeys && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() =>
                  updateAuthState({
                    step: "nostr-key-generation",
                    generatedKeys: null,
                  })
                }
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Back</span>
              </button>

              <div className="bg-red-900/30 border border-red-700 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-red-200 font-medium mb-2">
                  🔐 IMPORTANT: Save these keys securely!
                </p>
                <p className="text-xs sm:text-sm text-red-200">
                  We NEVER store your private key. If you lose it, you'll lose
                  access to your account permanently.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-3 sm:p-4 bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Private Key (Keep this secret!)
                  </label>
                  <div className="p-2 bg-gray-800 rounded border font-mono text-xs sm:text-sm text-white break-all">
                    {authState.generatedKeys.privateKey}
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Public Key (Safe to share)
                  </label>
                  <div className="p-2 bg-gray-800 rounded border font-mono text-xs sm:text-sm text-white break-all">
                    {authState.generatedKeys.publicKey}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Verification Required
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Enter first 10 characters of your private key:
                  </label>
                  <input
                    type="text"
                    value={validationInput.firstTen}
                    onChange={(e) =>
                      setValidationInput((prev) => ({
                        ...prev,
                        firstTen: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                    placeholder="First 10 characters..."
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Enter last 5 characters of your private key:
                  </label>
                  <input
                    type="text"
                    value={validationInput.lastFive}
                    onChange={(e) =>
                      setValidationInput((prev) => ({
                        ...prev,
                        lastFive: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                    placeholder="Last 5 characters..."
                    maxLength={5}
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-200">
                    Security Checklist:
                  </h4>
                  {Object.entries({
                    savedPrivateKey:
                      "I have saved my private key in a secure location",
                    understoodSecurity:
                      "I understand that losing my private key means losing access forever",
                    confirmedBackup:
                      "I have confirmed my backup and can access it",
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={checklist[key as keyof typeof checklist]}
                        onChange={(e) =>
                          setChecklist((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs sm:text-sm text-gray-300">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {errors.validation && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 sm:p-4">
                  <div className="text-red-200 text-sm">
                    {errors.validation}
                  </div>
                </div>
              )}

              <button
                onClick={validateKeys}
                disabled={isAuthenticating}
                className={cn(
                  "w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-colors text-sm sm:text-base",
                  "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                )}
              >
                {isAuthenticating
                  ? "Creating Account..."
                  : "Verify & Complete Setup"}
              </button>

              {errors.registration && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 sm:p-4">
                  <div className="text-red-200 text-sm">
                    {errors.registration}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Input for Nostr Users */}
          {authState.step === "email-for-nostr" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => {
                  const backStep =
                    authState.method === "browser"
                      ? "browser-extension"
                      : "nostr-wallet";
                  updateAuthState({ step: backStep });
                }}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Back</span>
              </button>

              <div className="bg-blue-900/30 border border-blue-700 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-200">
                  We need your email address to complete the registration and
                  send important notifications.
                </p>
              </div>

              <div>
                <label
                  htmlFor="email-nostr"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email-nostr"
                  value={authState.email}
                  onChange={(e) => updateAuthState({ email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {errors.email && (
                <div className="text-red-400 text-sm">{errors.email}</div>
              )}

              <button
                onClick={async () => {
                  if (
                    !authState.email ||
                    !/\S+@\S+\.\S+/.test(authState.email)
                  ) {
                    setErrors({ email: "Please enter a valid email address" });
                    return;
                  }

                  try {
                    await requestEmailAuth.mutateAsync({
                      email: authState.email,
                    });
                    updateAuthState({
                      step: "otp-verification",
                      userExists: false,
                    });
                  } catch (error) {
                    setErrors({
                      email:
                        error instanceof Error
                          ? error.message
                          : "Failed to send login code",
                    });
                  }
                }}
                disabled={isAuthenticating || !authState.email}
                className={cn(
                  "w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-colors text-sm sm:text-base",
                  "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                )}
              >
                {requestEmailAuth.isPending
                  ? "Sending Code..."
                  : "Send Verification Code"}
              </button>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-gray-300">
                <p className="font-medium text-white mb-1">
                  Your security matters
                </p>
                <p className="leading-relaxed">
                  We use military-grade encryption and never store your message
                  content. Everything is encrypted client-side before
                  transmission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
