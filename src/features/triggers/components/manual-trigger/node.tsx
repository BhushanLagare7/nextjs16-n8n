import { memo } from "react"

import { NodeProps } from "@xyflow/react"
import { MousePointerIcon } from "lucide-react"

import { BaseTriggerNode } from "../base-trigger-node"

/** Trigger node that starts the workflow on a manual "Execute" click */
export const ManualTriggerNode = memo((props: NodeProps) => {
  return (
    <>
      <BaseTriggerNode
        {...props}
        icon={MousePointerIcon}
        name="When clicking 'Execute workflow'"
        // status={nodeStatus} TODO
        // onSettings={handleOpenSettings} TODO
        // onDoubleClick={handleOpenSettings} TODO
      />
    </>
  )
})

ManualTriggerNode.displayName = "ManualTriggerNode"
