import { channel } from "inngest/realtime"
import { z } from "zod"

/** Realtime channel name for OpenAI node execution status. */
export const OPENAI_CHANNEL_NAME = "openai-execution"

export const openAiChannel = channel({
  name: OPENAI_CHANNEL_NAME,
  topics: {
    status: {
      schema: z.object({
        nodeId: z.string(),
        status: z.enum(["loading", "success", "error"]),
      }),
    },
  },
})
