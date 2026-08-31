"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTRPC } from "@/trpc/client"

/**
 * Home page.
 * Displays the list of workflows and provides a button to queue creation of a new one.
 */
export default function HomePage() {
  const trpc = useTRPC()

  // Fetch all existing workflows.
  const { data: workflows } = useQuery(trpc.getWorkflows.queryOptions())
  const queryClient = useQueryClient()

  // Mutation that enqueues a workflow creation job.
  // On success, notify the user and refetch the workflows list.
  const create = useMutation(
    trpc.createWorkflow.mutationOptions({
      onSuccess: () => {
        toast.success("Workflow creation job queued")
        queryClient.invalidateQueries(trpc.getWorkflows.queryOptions())
      },
    })
  )

  return (
    <div className="flex min-h-svh min-w-0 flex-col items-center justify-center p-6">
      {/* Debug view of current workflows */}
      {JSON.stringify(workflows, null, 2)}

      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        Create
      </Button>
    </div>
  )
}
