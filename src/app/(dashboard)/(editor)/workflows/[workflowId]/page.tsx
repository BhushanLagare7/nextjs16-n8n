import { requireAuth } from "@/lib/auth-utils"

interface WorkflowIdPageProps {
  params: Promise<{ workflowId: string }>
}

/**
 * Displays details for a single workflow (protected route)
 */
export default async function WorkflowIdPage({ params }: WorkflowIdPageProps) {
  await requireAuth()

  const { workflowId } = await params

  return <div>Workflow Id Page: {workflowId}</div>
}
