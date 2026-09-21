import type { Metadata } from "next"

import { LoginForm } from "@/features/auth/components/login-form"
import { requireUnauth } from "@/lib/auth-utils"

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Nodemation account to build, automate, and orchestrate complex workflows.",
  alternates: {
    canonical: "/login",
  },
}

/**
 * Login page — only accessible to unauthenticated users.
 */
export default async function LoginPage() {
  // Redirects to home if user is already logged in
  await requireUnauth()

  return <LoginForm />
}
