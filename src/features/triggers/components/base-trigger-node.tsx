"use client"

import { memo, type ReactNode } from "react"
import Image from "next/image"

import { type NodeProps, Position } from "@xyflow/react"
import type { LucideIcon } from "lucide-react"

import { BaseHandle } from "@/components/react-flow/base-handle"
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node"
import { WorkflowNode } from "@/components/workflow-node"

interface BaseTriggerNodeProps extends NodeProps {
  /** Lucide icon component or an image URL */
  icon: LucideIcon | string
  name: string
  description?: string
  children?: ReactNode
  // status?: NodeStatus;
  onSettings?: () => void
  onDoubleClick?: () => void
}

/**
 * Shared shell for trigger nodes.
 * Has only a source (right) handle since triggers start a workflow.
 */
export const BaseTriggerNode = memo(
  ({
    id,
    icon: Icon,
    name,
    description,
    children,
    onSettings,
    onDoubleClick,
  }: BaseTriggerNodeProps) => {
    // TODO: add delete method
    const handleDelete = () => {}

    return (
      <WorkflowNode
        description={description}
        name={name}
        onDelete={handleDelete}
        onSettings={onSettings}
      >
        {/* TODO: Wrap within NodeStatusIndicator */}
        {/* Rounded left edge visually distinguishes triggers from actions */}
        <BaseNode
          className="group relative rounded-l-2xl"
          onDoubleClick={onDoubleClick}
        >
          <BaseNodeContent>
            {typeof Icon === "string" ? (
              <Image alt={name} height={16} src={Icon} width={16} />
            ) : (
              <Icon className="size-4 text-muted-foreground" />
            )}
            {children}
            <BaseHandle id="source-1" position={Position.Right} type="source" />
          </BaseNodeContent>
        </BaseNode>
      </WorkflowNode>
    )
  }
)

BaseTriggerNode.displayName = "BaseTriggerNode"
