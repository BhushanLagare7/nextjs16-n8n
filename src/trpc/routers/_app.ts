import { inngest } from "@/inngest/client"
import { db } from "@/prisma/db"

import { createTRPCRouter, premiumProcedure, protectedProcedure } from "../init"

/**
 * Root tRPC router.
 * All procedures exposed to the client are defined here.
 */
export const appRouter = createTRPCRouter({
  /** Sends an execute/ai background job to Inngest */
  testAi: premiumProcedure.mutation(async () => {
    await inngest.send({
      name: "execute/ai",
    })

    return { success: true, message: "Job queued" }
  }),

  /** Fetches all workflows from the database. */
  getWorkflows: protectedProcedure.query(async () => {
    return await db.orm.public.Workflow.all()
  }),

  /**
   * Queues a workflow creation job via Inngest.
   * The actual DB write is handled asynchronously by the background worker.
   */
  createWorkflow: protectedProcedure.mutation(async () => {
    await inngest.send({
      name: "app/workflow.created",
      data: { name: "test-workflow" },
    })
  }),
})

// Export type definition of the API for use on the client.
export type AppRouter = typeof appRouter
