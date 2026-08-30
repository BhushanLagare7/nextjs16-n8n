import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { createTRPCContext } from "@/trpc/init"
import { appRouter } from "@/trpc/routers/_app"

/**
 * Next.js Route Handler that forwards incoming
 * requests to the tRPC fetch adapter.
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

// Support both GET and POST requests for tRPC
export { handler as GET, handler as POST }
