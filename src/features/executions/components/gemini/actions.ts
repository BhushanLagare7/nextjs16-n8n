"use server"

import { getClientSubscriptionToken } from "inngest/react"

import { geminiChannel } from "@/inngest/channels/gemini"
import { inngest } from "@/inngest/client"

/**
 * Server action to mint a realtime subscription token for Gemini
 * node status updates. The returned token is consumed by the useRealtime
 * hook on the client.
 */
export async function fetchGeminiRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: geminiChannel,
    topics: ["status"],
  })
}
