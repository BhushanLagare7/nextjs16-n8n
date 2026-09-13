"use client"

import { memo, useState } from "react"

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react"

import { openAiChannel } from "@/inngest/channels/openai"

import { useNodeStatus } from "../../hooks/use-node-status"
import { BaseExecutionNode } from "../base-execution-node"

import { fetchOpenAiRealtimeToken } from "./actions"
import { OpenAiDialog, OpenAiFormValues } from "./dialog"

type OpenAiNodeData = {
  variableName?: string
  systemPrompt?: string
  userPrompt?: string
}

type OpenAiNodeType = Node<OpenAiNodeData>

/**
 * Flow node representing an OpenAI text generation step.
 * Opens {@link OpenAiDialog} for configuration and displays live
 * execution status via {@link useNodeStatus}.
 */
export const OpenAiNode = memo((props: NodeProps<OpenAiNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { setNodes } = useReactFlow()

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: openAiChannel,
    topic: "status",
    refreshToken: fetchOpenAiRealtimeToken,
  })

  const handleOpenSettings = () => setDialogOpen(true)

  const handleSubmit = (values: OpenAiFormValues) => {
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
    ? `gpt-4: ${nodeData.userPrompt.slice(0, 50)}...`
    : "Not configured"

  return (
    <>
      <OpenAiDialog
        defaultValues={nodeData}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...props}
        description={description}
        icon="/logos/openai.svg"
        id={props.id}
        name="OpenAi"
        status={nodeStatus}
        onDoubleClick={handleOpenSettings}
        onSettings={handleOpenSettings}
      />
    </>
  )
})

OpenAiNode.displayName = "OpenAiNode"
