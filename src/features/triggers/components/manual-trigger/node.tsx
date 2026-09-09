import { memo, useState } from "react"

import { NodeProps } from "@xyflow/react"
import { MousePointerIcon } from "lucide-react"

import { useNodeStatus } from "@/features/executions/hooks/use-node-status"
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger"

import { BaseTriggerNode } from "../base-trigger-node"

import { fetchManualTriggerRealtimeToken } from "./actions"
import { ManualTriggerDialog } from "./dialog"

/**
 * Trigger node that starts the workflow on a manual "Execute" click.
 * No configuration is required — the dialog is purely informational.
 */
export const ManualTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: manualTriggerChannel,
    topic: "status",
    refreshToken: fetchManualTriggerRealtimeToken,
  })

  const handleOpenSettings = () => {
    setDialogOpen(true)
  }

  return (
    <>
      <ManualTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon={MousePointerIcon}
        name="When clicking 'Execute workflow'"
        status={nodeStatus}
        onDoubleClick={handleOpenSettings}
        onSettings={handleOpenSettings}
      />
    </>
  )
})

ManualTriggerNode.displayName = "ManualTriggerNode"
