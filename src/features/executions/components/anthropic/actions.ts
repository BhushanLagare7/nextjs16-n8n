"use server"

import { getClientSubscriptionToken } from "inngest/react"

import { anthropicChannel } from "@/inngest/channels/anthropic"
import { inngest } from "@/inngest/client"

/**
 * Server action to mint a realtime subscription token for Anthropic
 * node status updates. The returned token is consumed by the useRealtime
 * hook on the client.
 */
export async function fetchAnthropicRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: anthropicChannel,
    topics: ["status"],
  })
}
