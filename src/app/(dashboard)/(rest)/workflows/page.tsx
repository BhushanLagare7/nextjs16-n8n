import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

import {
  WorkflowsContainer,
  WorkflowsList,
} from "@/features/workflows/components/workflows"
import { prefetchWorkflows } from "@/features/workflows/server/prefetch"
import { requireAuth } from "@/lib/auth-utils"
import { HydrateClient } from "@/trpc/server"

/**
 * Lists all workflows (protected route)
 */
export default async function WorkflowsPage() {
  // Redirects to sign-in if the user is not authenticated
  await requireAuth()

  // Prefetch workflows on the server so the client can hydrate instantly
  prefetchWorkflows()

  return (
    <WorkflowsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<p>Error!</p>}>
          <Suspense fallback={<p>Loading...</p>}>
            <WorkflowsList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </WorkflowsContainer>
  )
}
