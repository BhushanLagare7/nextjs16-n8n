import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query"
// import superjson from "superjson"

/**
 * Factory function to create a new React Query client
 * with sensible defaults for SSR + tRPC usage.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Prevents immediate refetch on mount for 30s
        staleTime: 30 * 1000,
      },
      dehydrate: {
        // serializeData: superjson.serialize,
        // Also dehydrate queries that are still pending (for streaming SSR)
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        // deserializeData: superjson.deserialize,
      },
    },
  })
}
