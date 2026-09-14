import { channel } from "inngest/realtime"
import { z } from "zod"

/** Realtime channel name for Gemini node execution status. */
export const GEMINI_CHANNEL_NAME = "gemini-execution"

export const geminiChannel = channel({
  name: GEMINI_CHANNEL_NAME,
  topics: {
    status: {
      schema: z.object({
        nodeId: z.string(),
        status: z.enum(["loading", "success", "error"]),
      }),
    },
  },
})
