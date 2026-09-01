import { requireAuth } from "@/lib/auth-utils"

/**
 * Lists all workflows (protected route)
 */
export default async function WorkflowsPage() {
  await requireAuth()

  return <div>Workflows Page</div>
}
