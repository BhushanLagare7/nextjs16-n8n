import { requireAuth } from "@/lib/auth-utils"

interface ExecutionIdPageProps {
  params: Promise<{ executionId: string }>
}

/**
 * Displays details for a single execution (protected route)
 */
export default async function ExecutionIdPage({
  params,
}: ExecutionIdPageProps) {
  await requireAuth()

  const { executionId } = await params

  return <div>Execution Id Page: {executionId}</div>
}
