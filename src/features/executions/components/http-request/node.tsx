"use client"

import { memo, useState } from "react"

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react"
import { GlobeIcon } from "lucide-react"

import { BaseExecutionNode } from "../base-execution-node"

import { FormType, HttpRequestDialog } from "./dialog"

/** User-configured data stored on an HTTP Request node */
type HttpRequestNodeData = {
  endpoint?: string
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: string
  [key: string]: unknown
}

type HttpRequestNodeType = Node<HttpRequestNodeData>

/**
 * Execution node that performs an HTTP request.
 * Configuration lives in `data`; opening settings shows the config dialog.
 */
export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { setNodes } = useReactFlow()

  // TODO: derive from real execution status once wired up
  const nodeStatus = "initial"

  const handleOpenSettings = () => {
    setDialogOpen(true)
  }

  /** Persist dialog values back onto the node's `data` object */
  const handleSubmit = (values: FormType) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              endpoint: values.endpoint,
              method: values.method,
              body: values.body,
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
        defaultBody={nodeData.body}
        defaultEndpoint={nodeData.endpoint} // TODO: Check if it can be improved by just sending initialValues={nodeData}
        defaultMethod={nodeData.method}
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

HttpRequestNode.displayName = "HttpRequestNode"
