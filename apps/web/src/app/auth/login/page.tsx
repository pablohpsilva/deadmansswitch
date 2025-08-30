"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Mail, Zap, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<"email" | "nostr" | null>(null);
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"method" | "email-input" | "password-input">(
    "method"
  );

  const handleEmailAuth = async () => {
    if (step === "email-input") {
      setIsLoading(true);
      // TODO: Call tRPC to request temp password
      console.log("Requesting temp password for:", email);
      setTimeout(() => {
        setIsLoading(false);
        setStep("password-input");
      }, 2000);
    } else if (step === "password-input") {
      setIsLoading(true);
      // TODO: Call tRPC to login with temp password
      console.log("Logging in with temp password:", tempPassword);
      setTimeout(() => {
        setIsLoading(false);
        // Redirect to dashboard
      }, 1500);
    }
  };

  const handleNostrAuth = async () => {
    setIsLoading(true);
    // TODO: Implement Nostr wallet connection
    console.log("Connecting with Nostr wallet");
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Dead Man's Switch
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                {step === "method" && "Choose how you'd like to sign in"}
                {step === "email-input" && "Enter your email address"}
                {step === "password-input" &&
                  "Check your email for the login code"}
              </p>
            </div>

            {/* Authentication Methods */}
            {step === "method" && (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setAuthMethod("email");
                    setStep("email-input");
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <p className="text-sm text-gray-600">
                        Get a secure login code via email
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setAuthMethod("nostr");
                    handleNostrAuth();
                  }}
                  disabled={isLoading}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Nostr Wallet
                      </h3>
                      <p className="text-sm text-gray-600">
                        Connect with your Nostr wallet
                      </p>
                    </div>
                  </div>
                </button>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    New here?{" "}
                    <span className="text-blue-600 font-semibold">
                      Just choose a method above to get started!
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Email Input */}
            {step === "email-input" && (
              <div className="space-y-6">
                <button
                  onClick={() => setStep("method")}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <button
                  onClick={handleEmailAuth}
                  disabled={isLoading || !email}
                  className={cn(
                    "w-full py-3 px-6 rounded-lg font-semibold transition-colors",
                    "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? "Sending Code..." : "Send Login Code"}
                </button>
              </div>
            )}

            {/* Password Input */}
            {step === "password-input" && (
              <div className="space-y-6">
                <button
                  onClick={() => setStep("email-input")}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    We've sent a temporary login code to{" "}
                    <strong>{email}</strong>. The code is valid for 24 hours and
                    can only be used once.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Login Code
                  </label>
                  <input
                    type="text"
                    id="password"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-center text-lg"
                    placeholder="Enter the code from your email"
                    required
                  />
                </div>

                <button
                  onClick={handleEmailAuth}
                  disabled={isLoading || !tempPassword}
                  className={cn(
                    "w-full py-3 px-6 rounded-lg font-semibold transition-colors",
                    "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>

                <button
                  onClick={() => setStep("email-input")}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Need a new code? Click here
                </button>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">
                    Your security matters
                  </p>
                  <p>
                    We use military-grade encryption and never store your
                    message content. Everything is encrypted client-side before
                    transmission.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
