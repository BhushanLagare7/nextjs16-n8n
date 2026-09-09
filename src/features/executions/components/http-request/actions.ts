"use server"

import { getClientSubscriptionToken } from "inngest/react"

import { httpRequestChannel } from "@/inngest/channels/http-request"
import { inngest } from "@/inngest/client"

/**
 * Server action to mint a realtime subscription token for HTTP request
 * node status updates. The returned token is consumed by the useRealtime
 * hook on the client.
 */
export async function fetchHttpRequestRealtimeToken() {
  return getClientSubscriptionToken(inngest, {
    channel: httpRequestChannel,
    topics: ["status"],
  })
}
