import { credentialsRouter } from "@/features/credentials/server/routers"
import { executionsRouter } from "@/features/executions/server/routers"
import { workflowsRouter } from "@/features/workflows/server/routers"

import { createTRPCRouter } from "../init"

/**
 * Root tRPC router.
 * All procedures exposed to the client are defined here.
 */
export const appRouter = createTRPCRouter({
  workflows: workflowsRouter,
  credentials: credentialsRouter,
  executions: executionsRouter,
})

// Export type definition of the API for use on the client.
export type AppRouter = typeof appRouter
