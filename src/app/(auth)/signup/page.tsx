import { RegisterForm } from "@/features/auth/components/register-form"
import { requireUnauth } from "@/lib/auth-utils"

/**
 * Signup page — only accessible to unauthenticated users.
 */
export default async function SignupPage() {
  // Redirects to home if user is already logged in
  await requireUnauth()

  return <RegisterForm />
}
