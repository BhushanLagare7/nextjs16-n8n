import "server-only" // <-- ensure this file cannot be imported from the client

import { cache } from "react"

import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import {
  createTRPCOptionsProxy,
  ResolverDef,
  TRPCQueryOptions,
} from "@trpc/tanstack-react-query"

import { appRouter } from "./routers/_app"
import { createTRPCContext } from "./init"
import { makeQueryClient } from "./query-client"

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient)

/**
 * Server-side tRPC proxy.
 * Allows calling procedures directly (with type-safe query options)
 * from Server Components without going through HTTP.
 */
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
})

// If your router is on a separate server, pass a client:
// createTRPCOptionsProxy<AppRouter>({
//   client: createTRPCClient<AppRouter>({
//     links: [httpLink({ url: "..." })],
//   }),
//   queryClient: getQueryClient,
// })

/**
 * Wraps children with a HydrationBoundary,
 * passing prefetched query cache from server to client.
 */
export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  )
}

/**
 * Prefetches a query (regular or infinite) on the server
 * so data is ready before hydration on the client.
 */
export function prefetch<T extends ReturnType<TRPCQueryOptions<ResolverDef>>>(
  queryOptions: T
) {
  const queryClient = getQueryClient()
  if (queryOptions.queryKey[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(
      queryOptions as Parameters<typeof queryClient.prefetchInfiniteQuery>[0]
    )
  } else {
    void queryClient.prefetchQuery(queryOptions)
  }
}

// Direct server-side caller for invoking procedures without HTTP
export const caller = appRouter.createCaller(createTRPCContext)
