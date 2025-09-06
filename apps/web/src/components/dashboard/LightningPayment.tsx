/**
 * Lightning Payment Component
 * Handles Lightning Network payments for upgrades using NWC
 */

"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { nwcService, NWCUtils } from "@/lib/nwc";
import { trpc } from "@/lib/trpc";

interface LightningPaymentProps {
  tier: "premium" | "lifetime";
  onSuccess?: () => void;
  onCancel?: () => void;
}

type PaymentStep =
  | "connect"
  | "generating"
  | "invoice"
  | "paying"
  | "verifying"
  | "success"
  | "error";

export function LightningPayment({
  tier,
  onSuccess,
  onCancel,
}: LightningPaymentProps) {
  const [step, setStep] = useState<PaymentStep>("connect");
  const [invoice, setInvoice] = useState<string>("");
  const [paymentHash, setPaymentHash] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // tRPC mutations
  const createPremiumInvoice =
    (trpc as any).payments.createLightningPremiumInvoice.useMutation();
  const createLifetimeInvoice =
    (trpc as any).payments.createLightningLifetimeInvoice.useMutation();
  const verifyPayment = (trpc as any).payments.verifyLightningPayment.useMutation();
  const paymentStatus = (trpc as any).payments.getLightningPaymentStatus.useQuery(
    { paymentHash },
    { enabled: !!paymentHash, refetchInterval: 2000 }
  );

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (nwcService.connected) {
        setStep("generating");
        await generateInvoice();
      }
    };

    checkConnection();
  }, []);

  const generateInvoice = async () => {
    try {
      setError("");
      setStep("generating");

      // Create the invoice on backend
      const mutation =
        tier === "premium" ? createPremiumInvoice : createLifetimeInvoice;
      const result = await mutation.mutateAsync();

      setInvoiceData(result);
      setPaymentHash(result.paymentHash);

      // Generate Lightning invoice using NWC
      const invoiceResult = await nwcService.createInvoice(
        result.amount,
        result.description
      );

      if (!invoiceResult.success || !invoiceResult.invoice) {
        throw new Error(invoiceResult.error || "Failed to create invoice");
      }

      setInvoice(invoiceResult.invoice);
      setStep("invoice");
    } catch (err) {
      console.error("Failed to generate invoice:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate invoice"
      );
      setStep("error");
    }
  };

  const handlePayInvoice = async () => {
    if (!invoice) return;

    try {
      setError("");
      setStep("paying");

      const paymentResult = await nwcService.sendPayment({ invoice });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Payment failed");
      }

      // Verify the payment on backend
      if (paymentResult.preimage) {
        setStep("verifying");

        const verifyResult = await verifyPayment.mutateAsync({
          paymentHash,
          preimage: paymentResult.preimage,
          tier,
        });

        if (verifyResult.success) {
          setStep("success");
          onSuccess?.();
        }
      }
    } catch (err) {
      console.error("Payment failed:", err);
      setError(err instanceof Error ? err.message : "Payment failed");
      setStep("error");
    }
  };

  const copyInvoice = async () => {
    if (!invoice) return;

    try {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invoice:", err);
    }
  };

  const handleConnectWallet = async () => {
    // This would open wallet connection flow
    // For now, we'll assume user has already connected in auth
    if (!nwcService.connected) {
      setError("Please connect your Nostr wallet first");
      setStep("error");
      return;
    }

    await generateInvoice();
  };

  // Monitor payment status
  useEffect(() => {
    if (paymentStatus.data?.status === "paid" && step !== "success") {
      setStep("success");
      onSuccess?.();
    }
  }, [paymentStatus.data, step]);

  const renderStepContent = () => {
    switch (step) {
      case "connect":
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Connect Lightning Wallet
              </h3>
              <p className="text-gray-300">
                Connect your NWC-compatible wallet to make Lightning payments
              </p>
            </div>
            <button
              onClick={handleConnectWallet}
              className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        );

      case "generating":
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Generating Invoice
              </h3>
              <p className="text-gray-300">
                Creating Lightning invoice for your {tier} upgrade...
              </p>
            </div>
          </div>
        );

      case "invoice":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Lightning Invoice Ready
              </h3>
              <p className="text-gray-300">
                Pay {invoiceData?.amount.toLocaleString()} sats for {tier}{" "}
                access
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-200">
                  Lightning Invoice
                </span>
                <button
                  onClick={copyInvoice}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <div className="bg-gray-800 border rounded p-3">
                <code className="text-xs text-gray-200 break-all font-mono">
                  {invoice}
                </code>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePayInvoice}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Pay with Wallet
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-3 text-gray-300 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Payment Instructions</p>
                  <p>
                    You can pay this invoice using any Lightning wallet or copy
                    it to your preferred Lightning wallet app. The payment will
                    be automatically verified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "paying":
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 text-yellow-600 animate-spin mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Processing Payment
              </h3>
              <p className="text-gray-300">Sending Lightning payment...</p>
            </div>
          </div>
        );

      case "verifying":
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 text-green-600 animate-spin mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Verifying Payment
              </h3>
              <p className="text-gray-300">
                Confirming your payment and upgrading your account...
              </p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-300">
                Your account has been upgraded to {tier}. You can now enjoy all
                the premium features!
              </p>
            </div>
            {onSuccess && (
              <button
                onClick={onSuccess}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Payment Error
              </h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setError("");
                  setStep("connect");
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-3 text-gray-300 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-100">Lightning Payment</h2>
          <div className="flex items-center space-x-1 text-yellow-600">
            <Zap className="h-5 w-5" />
            <span className="text-sm font-medium">Lightning</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>
              Upgrading to {tier === "premium" ? "Premium" : "Lifetime"}:
            </strong>
            {tier === "premium"
              ? " $15/year • ~30,000 sats"
              : " $60 one-time • ~120,000 sats"}
          </p>
        </div>
      </div>

      {renderStepContent()}
    </div>
  );
}
