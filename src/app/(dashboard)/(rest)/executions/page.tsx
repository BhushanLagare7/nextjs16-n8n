import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

import type { SearchParams } from "nuqs"

import {
  ExecutionsContainer,
  ExecutionsError,
  ExecutionsList,
  ExecutionsLoading,
} from "@/features/executions/components/executions"
import { executionsParamsLoader } from "@/features/executions/server/params-loader"
import { prefetchExecutions } from "@/features/executions/server/prefetch"
import { requireAuth } from "@/lib/auth-utils"
import { HydrateClient } from "@/trpc/server"

type Props = {
  searchParams: Promise<SearchParams>
}

/**
 * Lists all workflow executions (protected route)
 */
export default async function ExecutionsPage({ searchParams }: Props) {
  await requireAuth()

  const params = await executionsParamsLoader(searchParams)
  prefetchExecutions(params)

  return (
    <ExecutionsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<ExecutionsError />}>
          <Suspense fallback={<ExecutionsLoading />}>
            <ExecutionsList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </ExecutionsContainer>
  )
}
