"use client"

import { memo, useState } from "react"

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react"

import { slackChannel } from "@/inngest/channels/slack"

import { useNodeStatus } from "../../hooks/use-node-status"
import { BaseExecutionNode } from "../base-execution-node"

import { fetchSlackRealtimeToken } from "./actions"
import { SlackDialog, type SlackFormValues } from "./dialog"

type SlackNodeData = {
  variableName?: string
  content?: string
  webhookUrl?: string
}

type SlackNodeType = Node<SlackNodeData>

/**
 * Flow node representing a Slack message step.
 * Opens {@link SlackDialog} for configuration and displays live
 * execution status via {@link useNodeStatus}.
 */
export const SlackNode = memo((props: NodeProps<SlackNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { setNodes } = useReactFlow()

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: slackChannel,
    topic: "status",
    refreshToken: fetchSlackRealtimeToken,
  })

  const handleOpenSettings = () => setDialogOpen(true)

  const handleSubmit = (values: SlackFormValues) => {
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
      <SlackDialog
        defaultValues={nodeData}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...props}
        description={description}
        icon="/logos/slack.svg"
        id={props.id}
        name="Slack"
        status={nodeStatus}
        onDoubleClick={handleOpenSettings}
        onSettings={handleOpenSettings}
      />
    </>
  )
})

SlackNode.displayName = "SlackNode"
