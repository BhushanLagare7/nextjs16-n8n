"use client"

import { useSuspenseQuery } from "@tanstack/react-query"

import { useTRPC } from "@/trpc/client"

/**
 * Client Component that reads the prefetched
 * `getUsers` query and renders the result.
 */
export function Client() {
  const trpc = useTRPC()

  // Suspends until data is available (already hydrated from server prefetch)
  const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions())

  return <div>{JSON.stringify(users, null, 2)}</div>
}
