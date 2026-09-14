"use client"

import { memo, useState } from "react"

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react"

import { anthropicChannel } from "@/inngest/channels/anthropic"

import { useNodeStatus } from "../../hooks/use-node-status"
import { BaseExecutionNode } from "../base-execution-node"

import { fetchAnthropicRealtimeToken } from "./actions"
import { AnthropicDialog, AnthropicFormValues } from "./dialog"

type AnthropicNodeData = {
  variableName?: string
  systemPrompt?: string
  userPrompt?: string
}

type AnthropicNodeType = Node<AnthropicNodeData>

/**
 * Flow node representing an Anthropic (Claude) text generation step.
 * Opens {@link AnthropicDialog} for configuration and displays live
 * execution status via {@link useNodeStatus}.
 */
export const AnthropicNode = memo((props: NodeProps<AnthropicNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { setNodes } = useReactFlow()

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: anthropicChannel,
    topic: "status",
    refreshToken: fetchAnthropicRealtimeToken,
  })

  const handleOpenSettings = () => setDialogOpen(true)

  const handleSubmit = (values: AnthropicFormValues) => {
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
    ? `claude-sonnet-4-5: ${nodeData.userPrompt.slice(0, 50)}...`
    : "Not configured"

  return (
    <>
      <AnthropicDialog
        defaultValues={nodeData}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...props}
        description={description}
        icon="/logos/anthropic.svg"
        id={props.id}
        name="Anthropic"
        status={nodeStatus}
        onDoubleClick={handleOpenSettings}
        onSettings={handleOpenSettings}
      />
    </>
  )
})

AnthropicNode.displayName = "AnthropicNode"
