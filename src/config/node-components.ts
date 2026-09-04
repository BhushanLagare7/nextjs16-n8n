import type { NodeTypes } from "@xyflow/react"

import { InitialNode } from "@/components/initial-node"

import { NodeType } from "./constants"

/**
 * Maps each `NodeType` to the React component that renders it.
 * Passed to `<ReactFlow nodeTypes={...} />`.
 */
export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
} as const satisfies NodeTypes

/** Node types that currently have a registered component */
export type RegisteredNodeType = keyof typeof nodeComponents
