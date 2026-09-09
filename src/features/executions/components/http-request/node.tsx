"use client"

import { memo, useState } from "react"

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react"
import { GlobeIcon } from "lucide-react"

import { httpRequestChannel } from "@/inngest/channels/http-request"

import { useNodeStatus } from "../../hooks/use-node-status"
import { BaseExecutionNode } from "../base-execution-node"

import { fetchHttpRequestRealtimeToken } from "./actions"
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

/** React Flow node type parameterized with this node's data shape. */
type HttpRequestNodeType = Node<HttpRequestNodeData>

/**
 * Execution node that performs an HTTP request.
 *
 * Configuration lives in `props.data`; double-clicking or opening settings
 * opens {@link HttpRequestDialog} to edit it. Memoized to avoid unnecessary
 * re-renders as the graph changes.
 */
export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { setNodes } = useReactFlow()

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: httpRequestChannel,
    topic: "status",
    refreshToken: fetchHttpRequestRealtimeToken,
  })

  /** Opens the node's settings dialog. */
  const handleOpenSettings = () => {
    setDialogOpen(true)
  }

  /** Persists dialog values back onto this node's `data` object. */
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

// Required for readable component names in React DevTools when using memo
HttpRequestNode.displayName = "HttpRequestNode"
