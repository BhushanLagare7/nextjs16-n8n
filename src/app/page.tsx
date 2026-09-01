"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useTRPC } from "@/trpc/client"

/**
 * Primary home page component containing actions to trigger AI workflows.
 */
export default function HomePage() {
  const trpc = useTRPC()

  // Mutation to trigger the background AI pipeline via tRPC
  const testAi = useMutation(
    trpc.testAi.mutationOptions({
      onSuccess: () => {
        toast.success("AI Job queued")
      },
    })
  )

  return (
    <div className="flex min-h-svh min-w-0 flex-col items-center justify-center gap-4 p-6">
      <div className="flex items-center gap-2">
        <Button disabled={testAi.isPending} onClick={() => testAi.mutate()}>
          {testAi.isPending ? "Queuing..." : "Test AI"}
        </Button>
      </div>
    </div>
  )
}
