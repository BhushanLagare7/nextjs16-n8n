"use client"

import React, { forwardRef, type ReactNode, useCallback } from "react"

import {
  Handle,
  type NodeProps,
  Position,
  useNodeId,
  useReactFlow,
} from "@xyflow/react"

import { cn } from "@/lib/utils"

import { BaseNode } from "./base-node"

export type PlaceholderNodeProps = Partial<NodeProps> & {
  children?: ReactNode
  className?: string
  onClick?: (event?: React.MouseEvent<HTMLDivElement>) => void
}

/**
 * Clickable placeholder node used as an "add something here" slot.
 * Supports custom `onClick` handlers (e.g. opening a node picker) while retaining
 * the official React Flow behavior of un-animating edges and transforming the node.
 */
export const PlaceholderNode = forwardRef<HTMLDivElement, PlaceholderNodeProps>(
  ({ children, className, id: propId, onClick }, ref) => {
    const hookId = useNodeId()
    const id = hookId ?? propId
    const { setEdges, setNodes } = useReactFlow()

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        // Delegate to custom click handler if provided (e.g. node drawer/picker)
        if (onClick) {
          onClick(event)
          return
        }

        // Default React Flow behavior: mutate node to "default" and un-animate edges
        if (!id) return

        setEdges((edges) =>
          edges.map((edge) =>
            edge.target === id ? { ...edge, animated: false } : edge
          )
        )

        setNodes((nodes) =>
          nodes.map((node) => {
            if (node.id === id) {
              return {
                ...node,
                data: { ...node.data, label: "Node" },
                type: "default",
              }
            }
            return node
          })
        )
      },
      [id, onClick, setEdges, setNodes]
    )

    return (
      <BaseNode
        ref={ref}
        aria-label="Add a new node"
        className={cn(
          "h-auto w-auto cursor-pointer border-dashed border-muted-foreground/30 bg-card p-4 text-center text-muted-foreground shadow-none transition-colors hover:border-muted-foreground hover:bg-muted/50 hover:text-foreground",
          // "min-w-[150px]", // For now we use auto width
          className
        )}
        role="button"
        onClick={handleClick}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick(e as unknown as React.MouseEvent<HTMLDivElement>)
          }
        }}
      >
        {children}

        {/* Hidden handles keep edge routing and geometry working without exposing connection points */}
        <Handle
          isConnectable={false}
          position={Position.Top}
          style={{ visibility: "hidden" }}
          type="target"
        />
        <Handle
          isConnectable={false}
          position={Position.Bottom}
          style={{ visibility: "hidden" }}
          type="source"
        />
      </BaseNode>
    )
  }
)

PlaceholderNode.displayName = "PlaceholderNode"
