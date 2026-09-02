import type { inferInput } from "@trpc/tanstack-react-query"

import { prefetch, trpc } from "@/trpc/server"

type Input = inferInput<typeof trpc.workflows.getMany>

/**
 * Prefetch all workflows on the server
 * (used to hydrate the client query cache before render)
 */
export const prefetchWorkflows = (params: Input) => {
  return prefetch(trpc.workflows.getMany.queryOptions(params))
}
