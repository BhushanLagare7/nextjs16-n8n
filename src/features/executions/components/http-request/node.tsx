"use client"

import { memo } from "react"

import type { Node, NodeProps } from "@xyflow/react"
import { GlobeIcon } from "lucide-react"

import { BaseExecutionNode } from "../base-execution-node"

/** User-configured data stored on an HTTP Request node */
type HttpRequestNodeData = {
  endpoint?: string
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: string
  [key: string]: unknown
}

type HttpRequestNodeType = Node<HttpRequestNodeData>

/** Execution node that performs an HTTP request */
export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
  const nodeData = props.data as HttpRequestNodeData

  // Show "METHOD: endpoint" once configured, otherwise a placeholder
  const description = nodeData?.endpoint
    ? `${nodeData.method || "GET"}: ${nodeData.endpoint}`
    : "Not configured"

  return (
    <>
      <BaseExecutionNode
        {...props}
        description={description}
        icon={GlobeIcon}
        id={props.id}
        name="HTTP Request"
        onDoubleClick={() => {}} // TODO: open settings
        onSettings={() => {}} // TODO: open settings
      />
    </>
  )
})

HttpRequestNode.displayName = "HttpRequestNode"
