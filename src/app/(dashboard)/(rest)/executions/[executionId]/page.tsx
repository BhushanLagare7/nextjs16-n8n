import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import type { Metadata } from "next"

import { ExecutionView } from "@/features/executions/components/execution"
import {
  ExecutionsError,
  ExecutionsLoading,
} from "@/features/executions/components/executions"
import { prefetchExecution } from "@/features/executions/server/prefetch"
import { requireAuth } from "@/lib/auth-utils"
import { HydrateClient } from "@/trpc/server"

export const metadata: Metadata = {
  title: "Execution Details",
}

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
  prefetchExecution(executionId)

  return (
    <div className="h-full p-4 md:px-10 md:py-6">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-y-8">
        <HydrateClient>
          <ErrorBoundary fallback={<ExecutionsError />}>
            <Suspense fallback={<ExecutionsLoading />}>
              <ExecutionView executionId={executionId} />
            </Suspense>
          </ErrorBoundary>
        </HydrateClient>
      </div>
    </div>
  )
}
