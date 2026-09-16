import { channel } from "inngest/realtime"
import { z } from "zod"

/** Realtime channel name for Slack node execution status. */
export const SLACK_CHANNEL_NAME = "slack-execution"

export const slackChannel = channel({
  name: SLACK_CHANNEL_NAME,
  topics: {
    status: {
      schema: z.object({
        nodeId: z.string(),
        status: z.enum(["loading", "success", "error"]),
      }),
    },
  },
})
