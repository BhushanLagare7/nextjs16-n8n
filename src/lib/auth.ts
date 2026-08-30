import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { Pool } from "pg"

/**
 * Central auth instance configured with:
 * - Postgres as the database
 * - Email/password authentication
 * - Next.js cookie handling plugin
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
  plugins: [nextCookies()],
})
