"use server"

import { getClientSubscriptionToken } from "inngest/react"

import { manualTriggerChannel } from "@/inngest/channels/manual-trigger"
import { inngest } from "@/inngest/client"

/**
 * Server action to mint a realtime subscription token for manual trigger
 * node status updates. The returned token is consumed by the useRealtime
 * hook on the client.
 */
export async function fetchManualTriggerRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: manualTriggerChannel,
    topics: ["status"],
  })
}
