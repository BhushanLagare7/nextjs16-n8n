import { memo, useState } from "react"

import { NodeProps } from "@xyflow/react"

import { useNodeStatus } from "@/features/executions/hooks/use-node-status"
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger"

import { BaseTriggerNode } from "../base-trigger-node"

import { fetchGoogleFormTriggerRealtimeToken } from "./actions"
import { GoogleFormTriggerDialog } from "./dialog"

/**
 * Trigger node that fires when a Google Form submission is received via
 * webhook.
 */
export const GoogleFormTrigger = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: googleFormTriggerChannel,
    topic: "status",
    refreshToken: fetchGoogleFormTriggerRealtimeToken,
  })

  const handleOpenSettings = () => {
    setDialogOpen(true)
  }

  return (
    <>
      <GoogleFormTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        description="When form is submitted"
        icon="/logos/googleform.svg"
        name="Google Form"
        status={nodeStatus}
        onDoubleClick={handleOpenSettings}
        onSettings={handleOpenSettings}
      />
    </>
  )
})

GoogleFormTrigger.displayName = "GoogleFormTrigger"
