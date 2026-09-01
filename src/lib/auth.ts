import { checkout, polar, portal } from "@polar-sh/better-auth"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { Pool } from "pg"

import { polarClient } from "./polar"

/**
 * Central auth instance configured with:
 * - Postgres as the database
 * - Email/password authentication
 * - Next.js cookie handling plugin
 * - Polar plugin for checkout/billing portal integration
 */
export const auth = betterAuth({
  // Postgres connection pool for storing auth data
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
  },
  // Enables cookie-based session support in Next.js
  plugins: [
    nextCookies(),
    polar({
      client: polarClient,
      // Automatically create a Polar customer record when a user signs up
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId:
                process.env.POLAR_PRODUCT_ID ??
                "2d44d052-1365-4af1-ab94-999a04bf1a60", // ID of Product from Polar Dashboard
              slug: "pro", // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
            },
          ],
          successUrl: process.env.POLAR_SUCCESS_URL,
          // Restricts checkout to logged-in users only
          authenticatedUsersOnly: true,
        }),
        // Enables self-serve billing portal for customers
        portal(),
      ],
    }),
  ],
})
