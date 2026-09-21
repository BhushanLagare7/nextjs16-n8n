import type { Metadata } from "next"

import { RegisterForm } from "@/features/auth/components/register-form"
import { requireUnauth } from "@/lib/auth-utils"

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your Nodemation account and start designing event-driven workflow automations with AI and integrations.",
  alternates: {
    canonical: "/signup",
  },
}

/**
 * Signup page — only accessible to unauthenticated users.
 */
export default async function SignupPage() {
  // Redirects to home if user is already logged in
  await requireUnauth()

  return <RegisterForm />
}
