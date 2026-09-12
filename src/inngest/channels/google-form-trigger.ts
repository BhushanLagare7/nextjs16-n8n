import { channel } from "inngest/realtime"
import { z } from "zod"

/** Realtime channel name for Google Form trigger node execution status. */
export const GOOGLE_FORM_TRIGGER_CHANNEL_NAME = "google-form-trigger-execution"

export const googleFormTriggerChannel = channel({
  name: GOOGLE_FORM_TRIGGER_CHANNEL_NAME,
  topics: {
    status: {
      schema: z.object({
        nodeId: z.string(),
        status: z.enum(["loading", "success", "error"]),
      }),
    },
  },
})
