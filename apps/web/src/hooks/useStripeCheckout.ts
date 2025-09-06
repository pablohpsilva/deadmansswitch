"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { redirectToCheckout } from "@/lib/stripe";

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createPremiumCheckout = trpc.payments.createPremiumCheckout.useMutation(
    {
      onSuccess: async (data: any) => {
        try {
          await redirectToCheckout(data.sessionId);
        } catch (err) {
          setError("Failed to redirect to checkout");
          setIsLoading(false);
        }
      },
      onError: (err: any) => {
        setError(err.message);
        setIsLoading(false);
      },
    }
  );

  const createLifetimeCheckout =
    trpc.payments.createLifetimeCheckout.useMutation({
      onSuccess: async (data: any) => {
        try {
          await redirectToCheckout(data.sessionId);
        } catch (err) {
          setError("Failed to redirect to checkout");
          setIsLoading(false);
        }
      },
      onError: (err: any) => {
        setError(err.message);
        setIsLoading(false);
      },
    });

  const handlePremiumCheckout = async () => {
    setIsLoading(true);
    setError(null);

    const successUrl = `${window.location.origin}/dashboard?upgrade=success`;
    const cancelUrl = `${window.location.origin}/dashboard/pricing?canceled=true`;

    createPremiumCheckout.mutate({
      successUrl,
      cancelUrl,
    });
  };

  const handleLifetimeCheckout = async () => {
    setIsLoading(true);
    setError(null);

    const successUrl = `${window.location.origin}/dashboard?upgrade=success`;
    const cancelUrl = `${window.location.origin}/dashboard/pricing?canceled=true`;

    createLifetimeCheckout.mutate({
      successUrl,
      cancelUrl,
    });
  };

  return {
    handlePremiumCheckout,
    handleLifetimeCheckout,
    isLoading,
    error,
  };
}
