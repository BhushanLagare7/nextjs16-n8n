"use client"

import type { Realtime } from "inngest"
import { type ClientSubscriptionToken, useRealtime } from "inngest/react"

import type { NodeStatus } from "@/components/react-flow/node-status-indicator"

/**
 * Options for {@link useNodeStatus}.
 *
 * @property nodeId - The node whose status to track.
 * @property channel - Channel definition for the realtime subscription.
 * @property topic - Topic name within the channel to listen on.
 * @property refreshToken - Server action that returns a subscription token.
 */
interface UseNodeStatusOptions {
  nodeId: string
  channel: Realtime.ChannelInput
  topic: string
  refreshToken: () => Promise<ClientSubscriptionToken>
}

/**
 * Subscribes to a realtime channel and returns the latest execution status
 * for a specific workflow node.
 *
 * @returns The node's current {@link NodeStatus}, or `"initial"` if no message has been received.
 */
export function useNodeStatus({
  nodeId,
  channel,
  topic,
  refreshToken,
}: UseNodeStatusOptions): NodeStatus {
  const { messages } = useRealtime({
    channel,
    topics: [topic],
    token: refreshToken,
  })

  const latestMessage = messages?.all
    ?.filter(
      (msg) => (msg as { data?: { nodeId?: string } }).data?.nodeId === nodeId
    )
    .at(-1)

  if (latestMessage) {
    const data = latestMessage.data as { status?: NodeStatus }
    if (data?.status) {
      return data.status
    }
  }

  return "initial"
}
