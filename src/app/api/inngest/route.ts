// src/app/api/inngest/route.ts
import { serve } from "inngest/next"

import { inngest } from "@/inngest/client"
import { createWorkflow } from "@/inngest/functions"

/**
 * Next.js route handler that exposes registered Inngest functions.
 * The Inngest dev/prod server invokes these endpoints to run background jobs.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [createWorkflow],
})
