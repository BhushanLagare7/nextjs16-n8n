import { channel } from "inngest/realtime"
import { z } from "zod"

/** Realtime channel name for Discord node execution status. */
export const DISCORD_CHANNEL_NAME = "discord-execution"

export const discordChannel = channel({
  name: DISCORD_CHANNEL_NAME,
  topics: {
    status: {
      schema: z.object({
        nodeId: z.string(),
        status: z.enum(["loading", "success", "error"]),
      }),
    },
  },
})
