"use server"

import { getClientSubscriptionToken } from "inngest/react"

import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger"
import { inngest } from "@/inngest/client"

/**
 * Server action to mint a realtime subscription token for Stripe trigger
 * node status updates. The returned token is consumed by the useRealtime
 * hook on the client.
 */
export async function fetchStripeTriggerRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: stripeTriggerChannel,
    topics: ["status"],
  })
}
