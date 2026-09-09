import { channel } from "inngest/realtime"
import { z } from "zod"

/** Realtime channel name for HTTP request node execution status. */
export const HTTP_REQUEST_CHANNEL_NAME = "http-request-execution"

export const httpRequestChannel = channel({
  name: HTTP_REQUEST_CHANNEL_NAME,
  topics: {
    status: {
      schema: z.object({
        nodeId: z.string(),
        status: z.enum(["loading", "success", "error"]),
      }),
    },
  },
})
