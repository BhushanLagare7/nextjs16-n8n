import { Polar } from "@polar-sh/sdk"

/**
 * Shared Polar SDK client instance.
 * Used for billing, subscriptions, and customer state.
 */
export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Use 'sandbox' if you're using the Polar Sandbox environment
  // Remember that access tokens, products, etc. are completely separated between environments.
  // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
})
