"use client"

import type { ReactNode } from "react"

import { NodeToolbar, Position } from "@xyflow/react"
import { SettingsIcon, TrashIcon } from "lucide-react"

import { Button } from "./ui/button"

interface WorkflowNodeProps {
  children: ReactNode
  /** Show the settings/delete toolbar on selection. Defaults to `true`. */
  showToolbar?: boolean
  onDelete?: () => void
  onSettings?: () => void
  /** Label rendered beneath the node; also gates the description. */
  name?: string
  description?: string
}

/**
 * Shared chrome for every workflow node: an action toolbar above,
 * the node body, and an optional name/description caption below.
 */
export function WorkflowNode({
  children,
  showToolbar = true,
  onDelete,
  onSettings,
  name,
  description,
}: WorkflowNodeProps) {
  return (
    <>
      {/* Action toolbar — only visible while the node is selected */}
      {showToolbar && (
        <NodeToolbar>
          <Button
            aria-label="Open node settings"
            size="sm"
            variant="ghost"
            onClick={onSettings}
          >
            <SettingsIcon className="size-4" />
          </Button>
          <Button
            aria-label="Delete node"
            size="sm"
            variant="ghost"
            onClick={onDelete}
          >
            <TrashIcon className="size-4" />
          </Button>
        </NodeToolbar>
      )}
      {children}
      {/* Always-visible caption below the node */}
      {name && (
        <NodeToolbar
          className="max-w-[200px] text-center"
          isVisible
          position={Position.Bottom}
        >
          <p className="font-medium">{name}</p>
          {description && (
            <p className="truncate text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </NodeToolbar>
      )}
    </>
  )
}
