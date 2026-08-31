// src/inngest/functions.ts
import { db } from "@/prisma/db"

import { inngest } from "./client"

/**
 * Background function triggered by the `app/workflow.created` event.
 * Persists the new workflow to the database.
 */
export const createWorkflow = inngest.createFunction(
  { id: "create-workflow", triggers: { event: "app/workflow.created" } },
  async ({ step, event }) => {
    // Wrap the DB write in a step for retries and observability.
    await step.run("handle-workflow", async () => {
      return await db.orm.public.Workflow.create({
        name: event.data.name,
      })
    })
  }
)
