"use server"

import { getClientSubscriptionToken } from "inngest/react"

import { slackChannel } from "@/inngest/channels/slack"
import { inngest } from "@/inngest/client"

/**
 * Server action to mint a realtime subscription token for Slack
 * node status updates. The returned token is consumed by the useRealtime
 * hook on the client.
 */
export async function fetchSlackRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: slackChannel,
    topics: ["status"],
  })
}
