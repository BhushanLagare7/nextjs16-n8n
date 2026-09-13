import { memo, useState } from "react"

import type { NodeProps } from "@xyflow/react"

import { useNodeStatus } from "@/features/executions/hooks/use-node-status"
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger"

import { BaseTriggerNode } from "../base-trigger-node"

import { fetchStripeTriggerRealtimeToken } from "./actions"
import { StripeTriggerDialog } from "./dialog"

/**
 * Trigger node that fires when a Stripe webhook event is captured.
 */
export const StripeTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: stripeTriggerChannel,
    topic: "status",
    refreshToken: fetchStripeTriggerRealtimeToken,
  })

  const handleOpenSettings = () => {
    setDialogOpen(true)
  }

  return (
    <>
      <StripeTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        description="When stripe event is captured"
        icon="/logos/stripe.svg"
        name="Stripe"
        status={nodeStatus}
        onDoubleClick={handleOpenSettings}
        onSettings={handleOpenSettings}
      />
    </>
  )
})

StripeTriggerNode.displayName = "StripeTriggerNode"
