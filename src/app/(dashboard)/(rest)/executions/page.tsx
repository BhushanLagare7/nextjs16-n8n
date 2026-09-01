import { requireAuth } from "@/lib/auth-utils"

/**
 * Lists all workflow executions (protected route)
 */
export default async function ExecutionsPage() {
  await requireAuth()

  return <div>Executions Page</div>
}
