import { channel } from "inngest/realtime"
import { z } from "zod"

/** Realtime channel name for manual trigger node execution status. */
export const MANUAL_TRIGGER_CHANNEL_NAME = "manual-trigger-execution"

export const manualTriggerChannel = channel({
  name: MANUAL_TRIGGER_CHANNEL_NAME,
  topics: {
    status: {
      schema: z.object({
        nodeId: z.string(),
        status: z.enum(["loading", "success", "error"]),
      }),
    },
  },
})
