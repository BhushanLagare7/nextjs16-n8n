"use client"

import { memo, useState } from "react"

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react"
import { GlobeIcon } from "lucide-react"

import { BaseExecutionNode } from "../base-execution-node"

import { HttpRequestDialog, HttpRequestFormValues } from "./dialog"

/**
 * User-configured data stored on an HTTP Request node.
 * Mirrors the fields exposed in {@link HttpRequestDialog}.
 */
type HttpRequestNodeData = {
  variableName?: string
  endpoint?: string
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: string
}

/** React Flow node type parameterized with our node's data shape. */
type HttpRequestNodeType = Node<HttpRequestNodeData>

/**
 * Execution node that performs an HTTP request.
 *
 * Configuration lives in `props.data`; double-clicking or opening
 * settings shows the {@link HttpRequestDialog} to edit it. Rendering
 * is memoized to avoid unnecessary re-renders as the graph changes.
 */
export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { setNodes } = useReactFlow()

  // TODO: derive from real execution status once wired up
  const nodeStatus = "initial"

  /** Open the settings dialog. */
  const handleOpenSettings = () => {
    setDialogOpen(true)
  }

  /** Persist dialog values back onto this node's `data` object. */
  const handleSubmit = (values: HttpRequestFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...values,
            },
          }
        }
        return node
      })
    )
  }

  const nodeData = props.data

  // Show "METHOD: endpoint" once configured, otherwise a placeholder
  const description = nodeData?.endpoint
    ? `${nodeData.method || "GET"}: ${nodeData.endpoint}`
    : "Not configured"

  return (
    <>
      <HttpRequestDialog
        defaultValues={nodeData}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...props}
        description={description}
        icon={GlobeIcon}
        id={props.id}
        name="HTTP Request"
        status={nodeStatus}
        onDoubleClick={handleOpenSettings}
        onSettings={handleOpenSettings}
      />
    </>
  )
})

// Required for readable names in React DevTools when using memo
HttpRequestNode.displayName = "HttpRequestNode"
