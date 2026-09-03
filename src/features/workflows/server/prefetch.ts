import type { inferInput } from "@trpc/tanstack-react-query"

import { prefetch, trpc } from "@/trpc/server"

// Input type for the `getMany` query, inferred directly from the router
type Input = inferInput<typeof trpc.workflows.getMany>

/**
 * Prefetch all workflows on the server
 * (used to hydrate the client query cache before render)
 */
export function prefetchWorkflows(params: Input = {}) {
  return prefetch(trpc.workflows.getMany.queryOptions(params))
}

/**
 * Prefetch a single workflow on the server
 * (used to hydrate the client query cache before render)
 */
export function prefetchWorkflow(id: string) {
  return prefetch(trpc.workflows.getOne.queryOptions({ id }))
}
