"use client"

import { memo, useState } from "react"

import type { NodeProps } from "@xyflow/react"
import { PlusIcon } from "lucide-react"

import { PlaceholderNode } from "./react-flow/placeholder-node"
import { NodeSelector } from "./node-selector"
import { WorkflowNode } from "./workflow-node"

/**
 * The starting node of an empty workflow.
 * Renders as a dashed "+" placeholder that will open the node picker.
 */
export const InitialNode = memo((props: NodeProps) => {
  const [selectorOpen, setSelectorOpen] = useState(false)

  return (
    <NodeSelector open={selectorOpen} onOpenChange={setSelectorOpen}>
      {/* No toolbar: the initial node can't be deleted or configured */}
      <WorkflowNode showToolbar={false}>
        <PlaceholderNode {...props} onClick={() => setSelectorOpen(true)}>
          <div className="flex cursor-pointer items-center justify-center">
            <PlusIcon className="size-4" />
          </div>
        </PlaceholderNode>
      </WorkflowNode>
    </NodeSelector>
  )
})

InitialNode.displayName = "InitialNode"
