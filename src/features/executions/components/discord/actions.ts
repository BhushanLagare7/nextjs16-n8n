"use server"

import { getClientSubscriptionToken } from "inngest/react"

import { discordChannel } from "@/inngest/channels/discord"
import { inngest } from "@/inngest/client"

/**
 * Server action to mint a realtime subscription token for Discord
 * node status updates. The returned token is consumed by the useRealtime
 * hook on the client.
 */
export async function fetchDiscordRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: discordChannel,
    topics: ["status"],
  })
}
