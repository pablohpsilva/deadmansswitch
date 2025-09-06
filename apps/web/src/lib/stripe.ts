import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export { stripePromise };

// This function is not needed since we're using tRPC mutations directly

export async function redirectToCheckout(sessionId: string) {
  const stripe = await stripePromise;
  if (!stripe) {
    throw new Error("Stripe failed to initialize");
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    console.error("Stripe checkout error:", error);
    throw error;
  }
}
