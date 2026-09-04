import type { NodeTypes } from "@xyflow/react"

import { InitialNode } from "@/components/initial-node"
import { HttpRequestNode } from "@/features/executions/components/http-request/node"
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node"

import { NodeType } from "./constants"

/**
 * Maps each `NodeType` to the React component that renders it.
 * Passed to `<ReactFlow nodeTypes={...} />`.
 */
export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.HTTP_REQUEST]: HttpRequestNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
} as const satisfies NodeTypes

/** Node types that currently have a registered component */
export type RegisteredNodeType = keyof typeof nodeComponents
