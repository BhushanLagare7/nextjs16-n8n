import toposort from "toposort"

import type { FieldOutputTypes } from "@/prisma/contract.d"

type Node = FieldOutputTypes["public"]["Node"]
type Connection = FieldOutputTypes["public"]["Connection"]

/**
 * Orders workflow nodes so that every node appears after its dependencies.
 *
 * - Isolated nodes (no incoming/outgoing edges) are preserved via self-edges.
 * - Throws if the graph contains a cycle.
 *
 * @param nodes - All nodes in the workflow.
 * @param connections - Directed edges (fromNodeId → toNodeId) between nodes.
 * @returns Nodes in a valid execution order.
 */
export const topologicalSort = (
  nodes: Node[],
  connections: Connection[]
): Node[] => {
  // Fast path: with no edges, any order is valid
  if (connections.length === 0) {
    return nodes
  }

  // Build the edge list consumed by the `toposort` library
  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ])

  // Track which nodes participate in at least one connection
  const connectedNodeIds = new Set<string>()
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId)
    connectedNodeIds.add(conn.toNodeId)
  }

  // Include orphan nodes by adding a harmless self-edge for each
  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id])
    }
  }

  // Run the sort and normalize the result
  let sortedNodeIds: string[]
  try {
    sortedNodeIds = toposort(edges)
    // Self-edges introduce duplicates — strip them while preserving order
    sortedNodeIds = [...new Set(sortedNodeIds)]
  } catch (error) {
    // Surface cycle detection as a domain-friendly error
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Workflow contains a cycle")
    }
    throw error
  }

  // Rehydrate node objects from the sorted ID list
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean)
}
