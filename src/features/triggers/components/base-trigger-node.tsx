"use client"

import { memo, type ReactNode } from "react"
import Image from "next/image"

import { type NodeProps, Position, useReactFlow } from "@xyflow/react"
import type { LucideIcon } from "lucide-react"

import { BaseHandle } from "@/components/react-flow/base-handle"
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node"
import {
  type NodeStatus,
  NodeStatusIndicator,
} from "@/components/react-flow/node-status-indicator"
import { WorkflowNode } from "@/components/workflow-node"

interface BaseTriggerNodeProps extends NodeProps {
  /** Lucide icon component or an image URL */
  icon: LucideIcon | string
  name: string
  description?: string
  children?: ReactNode
  status?: NodeStatus
  onSettings?: () => void
  onDoubleClick?: () => void
}

/**
 * Shared shell for trigger nodes.
 * Has only a source (right) handle since triggers start a workflow —
 * there is no upstream input to accept.
 */
export const BaseTriggerNode = memo(
  ({
    id,
    icon: Icon,
    name,
    description,
    children,
    status = "initial",
    onSettings,
    onDoubleClick,
  }: BaseTriggerNodeProps) => {
    const { setNodes, setEdges } = useReactFlow()

    /** Remove this node and any edges connected to it */
    const handleDelete = () => {
      setNodes((currentNodes) => {
        const updatedNodes = currentNodes.filter((node) => node.id !== id)
        return updatedNodes
      })

      setEdges((currentEdges) => {
        const updatedEdges = currentEdges.filter(
          (edge) => edge.source !== id && edge.target !== id
        )
        return updatedEdges
      })
    }

    return (
      <WorkflowNode
        description={description}
        name={name}
        onDelete={handleDelete}
        onSettings={onSettings}
      >
        {/* Rounded left edge visually distinguishes triggers from actions */}
        <NodeStatusIndicator
          className="rounded-l-2xl"
          status={status}
          variant="border"
        >
          <BaseNode
            className="group relative rounded-l-2xl"
            status={status}
            onDoubleClick={onDoubleClick}
          >
            <BaseNodeContent>
              {typeof Icon === "string" ? (
                <Image alt={name} height={16} src={Icon} width={16} />
              ) : (
                <Icon className="size-4 text-muted-foreground" />
              )}
              {children}
              {/* Output-only handle: triggers are always the graph's starting point */}
              <BaseHandle
                id="source-1"
                position={Position.Right}
                type="source"
              />
            </BaseNodeContent>
          </BaseNode>
        </NodeStatusIndicator>
      </WorkflowNode>
    )
  }
)

BaseTriggerNode.displayName = "BaseTriggerNode"
