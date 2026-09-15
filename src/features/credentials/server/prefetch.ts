import type { inferInput } from "@trpc/tanstack-react-query"

import { prefetch, trpc } from "@/trpc/server"

// Input type for the `getMany` query, inferred directly from the router
type Input = inferInput<typeof trpc.credentials.getMany>

/**
 * Prefetch all credentials on the server
 * (used to hydrate the client query cache before render)
 */
export function prefetchCredentials(params: Input = {}) {
  return prefetch(trpc.credentials.getMany.queryOptions(params))
}

/**
 * Prefetch a single credential on the server
 * (used to hydrate the client query cache before render)
 */
export function prefetchCredential(id: string) {
  return prefetch(trpc.credentials.getOne.queryOptions({ id }))
}
