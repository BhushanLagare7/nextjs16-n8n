"use server"

import { getClientSubscriptionToken } from "inngest/react"

import { openAiChannel } from "@/inngest/channels/openai"
import { inngest } from "@/inngest/client"

/**
 * Server action to mint a realtime subscription token for OpenAI
 * node status updates. The returned token is consumed by the useRealtime
 * hook on the client.
 */
export async function fetchOpenAiRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: openAiChannel,
    topics: ["status"],
  })
}
