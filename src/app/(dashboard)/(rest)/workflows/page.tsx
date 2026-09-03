import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

import type { SearchParams } from "nuqs/server"

import {
  WorkflowsContainer,
  WorkflowsError,
  WorkflowsList,
  WorkflowsLoading,
} from "@/features/workflows/components/workflows"
import { workflowsParamsLoader } from "@/features/workflows/server/params-loader"
import { prefetchWorkflows } from "@/features/workflows/server/prefetch"
import { requireAuth } from "@/lib/auth-utils"
import { HydrateClient } from "@/trpc/server"

type Props = {
  searchParams: Promise<SearchParams>
}

/**
 * Lists all workflows (protected route) with search and pagination
 */
export default async function WorkflowsPage({ searchParams }: Props) {
  // Redirects to sign-in if the user is not authenticated
  await requireAuth()

  const params = await workflowsParamsLoader(searchParams)

  // Prefetch workflows on the server so the client can hydrate instantly
  prefetchWorkflows(params)

  return (
    <WorkflowsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<WorkflowsError />}>
          <Suspense fallback={<WorkflowsLoading />}>
            <WorkflowsList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </WorkflowsContainer>
  )
}
