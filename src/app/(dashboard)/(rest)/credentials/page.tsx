import { requireAuth } from "@/lib/auth-utils"

/**
 * Lists all credentials (protected route)
 */
export default async function CredentialsPage() {
  await requireAuth()

  return <div>Credentials Page</div>
}
