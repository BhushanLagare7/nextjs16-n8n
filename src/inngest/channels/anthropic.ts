import { channel } from "inngest/realtime"
import { z } from "zod"

/** Realtime channel name for Anthropic node execution status. */
export const ANTHROPIC_CHANNEL_NAME = "anthropic-execution"

export const anthropicChannel = channel({
  name: ANTHROPIC_CHANNEL_NAME,
  topics: {
    status: {
      schema: z.object({
        nodeId: z.string(),
        status: z.enum(["loading", "success", "error"]),
      }),
    },
  },
})
