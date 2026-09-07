import { FlaskConicalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows"

/**
 * Button that triggers execution of a workflow by its ID.
 * Disables itself while the execution mutation is in flight.
 */
export function ExecuteWorkflowButton({ workflowId }: { workflowId: string }) {
  const executeWorkflow = useExecuteWorkflow()

  // Fire the execute mutation with the current workflow ID
  const handleExecute = () => {
    executeWorkflow.mutate({ id: workflowId })
  }

  return (
    <Button
      disabled={executeWorkflow.isPending}
      size="lg"
      onClick={handleExecute}
    >
      <FlaskConicalIcon className="size-4" />
      Execute workflow
    </Button>
  )
}
