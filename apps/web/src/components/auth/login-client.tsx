"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Zap, ArrowLeft, Chrome } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthMutations } from "@/hooks/useAuthMutations";
import { WalletConnect } from "./wallet-connect";
import { BrowserConnect } from "./browser-connect";

export function LoginClient() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<
    "email" | "browser" | "nostr" | null
  >(null);
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [step, setStep] = useState<
    | "method"
    | "email-input"
    | "password-input"
    | "browser-extension"
    | "nostr-wallet"
  >("method");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const {
    requestEmailAuth,
    loginWithEmail,
    loginWithNostr,
    checkAuthStatus,
    isAuthenticating,
  } = useAuthMutations();

  // Check if user is already authenticated on component mount
  React.useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleEmailAuth = async () => {
    if (step === "email-input") {
      // Validate email
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        setErrors({ email: "Please enter a valid email address" });
        return;
      }

      setErrors({});
      try {
        await requestEmailAuth.mutateAsync({ email });
        setStep("password-input");
      } catch (error) {
        setErrors({
          email:
            error instanceof Error
              ? error.message
              : "Failed to send login code",
        });
      }
    } else if (step === "password-input") {
      // Validate temp password
      if (!tempPassword.trim()) {
        setErrors({ password: "Please enter the login code" });
        return;
      }

      setErrors({});
      try {
        await loginWithEmail.mutateAsync({
          email,
          tempPassword: tempPassword.trim(),
        });
        // Navigation handled by the mutation's onSuccess
      } catch (error) {
        setErrors({
          password:
            error instanceof Error ? error.message : "Invalid login code",
        });
      }
    }
  };

  const handleBrowserAuth = async () => {
    setAuthMethod("browser");
    setStep("browser-extension");
    setErrors({});
  };

  const handleNostrAuth = async () => {
    setAuthMethod("nostr");
    setStep("nostr-wallet");
    setErrors({});
  };

  const handleWalletSuccess = async (
    publicKey: string,
    signature: string,
    message: string
  ) => {
    try {
      await loginWithNostr.mutateAsync({
        publicKey,
        signature,
        message,
      });
      // Navigation handled by the mutation's onSuccess
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
      await loginWithNostr.mutateAsync({
        publicKey,
        signature,
        message,
        signedEvent,
      });
      // Navigation handled by the mutation's onSuccess
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
              {step === "method" && "Choose how you'd like to sign in"}
              {step === "email-input" && "Enter your email address"}
              {step === "password-input" &&
                "Check your email for the login code"}
              {step === "browser-extension" && "Connect via browser extension"}
              {step === "nostr-wallet" &&
                "Connect your Nostr wallet for authentication"}
            </p>
          </div>

          {/* Authentication Methods */}
          {step === "method" && (
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => {
                  setAuthMethod("email");
                  setStep("email-input");
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
                onClick={() => {
                  setAuthMethod("nostr");
                  handleNostrAuth();
                }}
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
          {step === "email-input" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => setStep("method")}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {errors.email && (
                <div className="text-red-400 text-sm">{errors.email}</div>
              )}

              <button
                onClick={handleEmailAuth}
                disabled={isAuthenticating || !email}
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

          {/* Password Input */}
          {step === "password-input" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => setStep("email-input")}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Back</span>
              </button>

              <div className="bg-blue-900/30 border border-blue-700 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-200">
                  We've sent a temporary login code to{" "}
                  <strong className="text-white">{email}</strong>. The code is
                  valid for 24 hours and can only be used once.
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Login Code
                </label>
                <input
                  type="text"
                  id="password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-center text-base sm:text-lg placeholder-gray-400"
                  placeholder="Enter the code from your email"
                  required
                />
              </div>

              {errors.password && (
                <div className="text-red-400 text-sm">{errors.password}</div>
              )}

              <button
                onClick={handleEmailAuth}
                disabled={isAuthenticating || !tempPassword}
                className={cn(
                  "w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-colors text-sm sm:text-base",
                  "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                )}
              >
                {loginWithEmail.isPending ? "Signing In..." : "Sign In"}
              </button>

              <button
                onClick={() => {
                  setStep("email-input");
                  setTempPassword("");
                  setErrors({});
                }}
                disabled={isAuthenticating}
                className="w-full py-2 text-xs sm:text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Need a new code? Click here
              </button>
            </div>
          )}

          {/* Browser Extension Connection */}
          {step === "browser-extension" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => setStep("method")}
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
          {step === "nostr-wallet" && (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => setStep("method")}
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
