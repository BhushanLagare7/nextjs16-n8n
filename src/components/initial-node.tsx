"use client"

import { memo } from "react"

import type { NodeProps } from "@xyflow/react"
import { PlusIcon } from "lucide-react"

import { PlaceholderNode } from "./react-flow/placeholder-node"
import { WorkflowNode } from "./workflow-node"

/**
 * The starting node of an empty workflow.
 * Renders as a dashed "+" placeholder that will open the node picker.
 */
export const InitialNode = memo((props: NodeProps) => {
  return (
    // No toolbar: the initial node can't be deleted or configured
    <WorkflowNode showToolbar={false}>
      {/* TODO: wire onClick to the add-node flow */}
      <PlaceholderNode {...props} onClick={() => {}}>
        <div className="flex cursor-pointer items-center justify-center">
          <PlusIcon className="size-4" />
        </div>
      </PlaceholderNode>
    </WorkflowNode>
  )
})

InitialNode.displayName = "InitialNode"
