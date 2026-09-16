"use client"

import { memo, useState } from "react"

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react"

import { discordChannel } from "@/inngest/channels/discord"

import { useNodeStatus } from "../../hooks/use-node-status"
import { BaseExecutionNode } from "../base-execution-node"

import { fetchDiscordRealtimeToken } from "./actions"
import { DiscordDialog, type DiscordFormValues } from "./dialog"

type DiscordNodeData = {
  variableName?: string
  username?: string
  content?: string
  webhookUrl?: string
}

type DiscordNodeType = Node<DiscordNodeData>

/**
 * Flow node representing a Discord message step.
 * Opens {@link DiscordDialog} for configuration and displays live
 * execution status via {@link useNodeStatus}.
 */
export const DiscordNode = memo((props: NodeProps<DiscordNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { setNodes } = useReactFlow()

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: discordChannel,
    topic: "status",
    refreshToken: fetchDiscordRealtimeToken,
  })

  const handleOpenSettings = () => setDialogOpen(true)

  const handleSubmit = (values: DiscordFormValues) => {
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
  const description = nodeData?.content
    ? `Send: ${nodeData.content.slice(0, 50)}...`
    : "Not configured"

  return (
    <>
      <DiscordDialog
        defaultValues={nodeData}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...props}
        description={description}
        icon="/logos/discord.svg"
        id={props.id}
        name="Discord"
        status={nodeStatus}
        onDoubleClick={handleOpenSettings}
        onSettings={handleOpenSettings}
      />
    </>
  )
})

DiscordNode.displayName = "DiscordNode"
