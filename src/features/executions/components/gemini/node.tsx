"use client"

import { memo, useState } from "react"

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react"

import { geminiChannel } from "@/inngest/channels/gemini"

import { useNodeStatus } from "../../hooks/use-node-status"
import { BaseExecutionNode } from "../base-execution-node"

import { fetchGeminiRealtimeToken } from "./actions"
import { GeminiDialog, GeminiFormValues } from "./dialog"

type GeminiNodeData = {
  variableName?: string
  systemPrompt?: string
  userPrompt?: string
}

type GeminiNodeType = Node<GeminiNodeData>

/**
 * Flow node representing a Gemini text generation step.
 * Opens {@link GeminiDialog} for configuration and displays live
 * execution status via {@link useNodeStatus}.
 */
export const GeminiNode = memo((props: NodeProps<GeminiNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { setNodes } = useReactFlow()

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: geminiChannel,
    topic: "status",
    refreshToken: fetchGeminiRealtimeToken,
  })

  const handleOpenSettings = () => setDialogOpen(true)

  const handleSubmit = (values: GeminiFormValues) => {
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
  const description = nodeData?.userPrompt
    ? `gemini-2.0-flash: ${nodeData.userPrompt.slice(0, 50)}...`
    : "Not configured"

  return (
    <>
      <GeminiDialog
        defaultValues={nodeData}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...props}
        description={description}
        icon="/logos/gemini.svg"
        id={props.id}
        name="Gemini"
        status={nodeStatus}
        onDoubleClick={handleOpenSettings}
        onSettings={handleOpenSettings}
      />
    </>
  )
})

GeminiNode.displayName = "GeminiNode"
