import { LoginForm } from "@/features/auth/components/login-form"
import { requireUnauth } from "@/lib/auth-utils"

/**
 * Login page — only accessible to unauthenticated users.
 */
export default async function LoginPage() {
  // Redirects to home if user is already logged in
  await requireUnauth()

  return (
    <div>
      <LoginForm />
    </div>
  )
}
