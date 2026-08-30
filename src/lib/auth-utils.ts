import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "./auth"

/**
 * Guards a route/page that requires an authenticated user.
 * Redirects to /login if no session is found.
 */
export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return session
}

/**
 * Guards a route/page that should only be accessible
 * to unauthenticated users (e.g. login/signup pages).
 * Redirects to home if a session already exists.
 */
export const requireUnauth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/")
  }
}
