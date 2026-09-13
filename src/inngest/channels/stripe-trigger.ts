import { channel } from "inngest/realtime"
import { z } from "zod"

/** Realtime channel name for Stripe trigger node execution status. */
export const STRIPE_TRIGGER_CHANNEL_NAME = "stripe-trigger-execution"

export const stripeTriggerChannel = channel({
  name: STRIPE_TRIGGER_CHANNEL_NAME,
  topics: {
    status: {
      schema: z.object({
        nodeId: z.string(),
        status: z.enum(["loading", "success", "error"]),
      }),
    },
  },
})
