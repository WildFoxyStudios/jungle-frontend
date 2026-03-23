import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { api } from "./api";

// ─── Stripe singleton ─────────────────────────────────────────────────────────
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
      }
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

// ─── Checkout helpers ─────────────────────────────────────────────────────────

export interface CheckoutSessionPayload {
  orderId: string;
  amount: number;
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  session_id: string;
  url?: string;
}

/**
 * POST /orders/:orderId/payment
 * Initiates payment for an existing order.
 * On the backend, this updates payment_status and returns the order.
 */
export async function initiateOrderPayment(
  orderId: string,
  paymentId: string,
): Promise<{ success: boolean }> {
  const response = await api.post<{ success: boolean }>(
    `/orders/${orderId}/payment`,
    { payment_id: paymentId, status: "paid" },
  );
  return response.data;
}

/**
 * Creates a Stripe Checkout session on the backend (if you have a
 * Next.js API route or backend endpoint for it).
 * Falls back gracefully if Stripe is not configured.
 */
export async function createCheckoutSession(
  payload: CheckoutSessionPayload,
): Promise<CheckoutSessionResponse> {
  const response = await api.post<CheckoutSessionResponse>(
    "/payments/checkout-session",
    payload,
  );
  return response.data;
}

/**
 * Redirect the user to a Stripe-hosted checkout page.
 * @throws If Stripe is not initialised (key missing) or if the redirect fails.
 */
export async function redirectToCheckout(sessionId: string): Promise<void> {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error("Stripe no está configurado. Contacta al administrador.");
  }
  const { error } = await (
    stripe as Stripe & {
      redirectToCheckout: (opts: {
        sessionId: string;
      }) => Promise<{ error?: { message: string } }>;
    }
  ).redirectToCheckout({ sessionId });
  if (error?.message) {
    throw new Error(error.message);
  }
}
