import toposort from "toposort"

import type { FieldOutputTypes } from "@/prisma/contract.d"

import { inngest } from "./client"

type Node = FieldOutputTypes["public"]["Node"]
type Connection = FieldOutputTypes["public"]["Connection"]

/**
 * Orders workflow nodes so that every node appears after its dependencies.
 * Isolated nodes (no incoming/outgoing edges) are preserved via self-edges.
 *
 * @param nodes - All nodes in the workflow.
 * @param connections - Directed edges (fromNodeId → toNodeId) between nodes.
 * @returns Nodes in a valid execution order.
 * @throws If the graph contains a cycle.
 */
export const topologicalSort = (
  nodes: Node[],
  connections: Connection[]
): Node[] => {
  if (connections.length === 0) {
    return nodes
  }

  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ])

  const connectedNodeIds = new Set<string>()
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId)
    connectedNodeIds.add(conn.toNodeId)
  }

  // Orphan nodes need a self-edge to be included in the sort output
  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id])
    }
  }

  let sortedNodeIds: string[]
  try {
    sortedNodeIds = toposort(edges)
    // Self-edges introduce duplicates — strip while preserving order
    sortedNodeIds = [...new Set(sortedNodeIds)]
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Workflow contains a cycle")
    }
    throw error
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean)
}

/**
 * Dispatches an execution event to Inngest to run a workflow asynchronously.
 *
 * @param data - Workflow ID and optional initial data/context.
 */
export const sendWorkflowExecution = async (data: {
  workflowId: string
  initialData?: Record<string, unknown>
  [key: string]: unknown
}) => {
  return inngest.send({
    name: "workflows/execute.workflow",
    data,
  })
}
