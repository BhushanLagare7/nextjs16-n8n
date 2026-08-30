import { createAuthClient } from "better-auth/react"

/**
 * Client-side auth instance used in React components.
 * Falls back to localhost during local development.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
})

// Convenience exports for common auth actions/hooks
export const { signIn, signUp, useSession, signOut } = authClient
