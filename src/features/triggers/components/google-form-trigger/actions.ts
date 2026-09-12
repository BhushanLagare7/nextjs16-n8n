"use server"

import { getClientSubscriptionToken } from "inngest/react"

import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger"
import { inngest } from "@/inngest/client"

/**
 * Server action to mint a realtime subscription token for Google Form trigger
 * node status updates. The returned token is consumed by the useRealtime
 * hook on the client.
 */
export async function fetchGoogleFormTriggerRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: googleFormTriggerChannel,
    topics: ["status"],
  })
}
