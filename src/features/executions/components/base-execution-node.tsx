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

interface BaseExecutionNodeProps extends NodeProps {
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
 * Shared shell for execution (action) nodes.
 * Has both a target (left) and source (right) handle, meaning it accepts
 * input from a previous node and outputs to the next.
 */
export const BaseExecutionNode = memo(
  ({
    id,
    icon: Icon,
    name,
    description,
    children,
    status = "initial",
    onSettings,
    onDoubleClick,
  }: BaseExecutionNodeProps) => {
    const { setNodes, setEdges } = useReactFlow()

    /** Remove this node and any edges connected to it */
    const handleDelete = () => {
      setNodes((currentNodes) => {
        const updatedNodes = currentNodes.filter((node) => node.id !== id)
        return updatedNodes
      })

      setEdges((currentEdges) => {
        // Drop edges on both sides of this node
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
        <NodeStatusIndicator status={status} variant="border">
          <BaseNode onDoubleClick={onDoubleClick}>
            <BaseNodeContent>
              {/* Icon can be either a Lucide component or a remote image URL */}
              {typeof Icon === "string" ? (
                <Image alt={name} height={16} src={Icon} width={16} />
              ) : (
                <Icon className="size-4 text-muted-foreground" />
              )}
              {children}
              {/* Input (left) and output (right) handles */}
              <BaseHandle
                id="target-1"
                position={Position.Left}
                type="target"
              />
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

BaseExecutionNode.displayName = "BaseExecutionNode"
