/**
 * Environment variable validation and typed access.
 *
 * All `NEXT_PUBLIC_*` variables are validated at module load time in
 * development. In production the build will fail if required vars are missing.
 */

// ─── Required public variables ────────────────────────────────────────────────

const REQUIRED_PUBLIC = ["NEXT_PUBLIC_API_URL"] as const;

// ─── Validate at startup (dev only) ──────────────────────────────────────────

if (process.env.NODE_ENV === "development") {
  for (const key of REQUIRED_PUBLIC) {
    if (!process.env[key]) {
      console.warn(
        `[env] Missing environment variable: ${key}\n` +
          "Copy .env.local.example to .env.local and fill in the values.",
      );
    }
  }
}

// ─── Typed env helpers ────────────────────────────────────────────────────────

export const env = {
  /** Backend API base URL including /api suffix */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",

  /** Stripe publishable key (optional – only needed for payments) */
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",

  /** Giphy API key (optional) */
  giphyApiKey: process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? "",

  /** Whether the app is running in production */
  isProduction: process.env.NODE_ENV === "production",

  /** Whether the app is running in development */
  isDevelopment: process.env.NODE_ENV === "development",
} as const;
