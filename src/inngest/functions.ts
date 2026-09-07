// src/inngest/functions.ts
import { NonRetriableError } from "inngest"

import { NodeType } from "@/config/constants"
import { getExecutor } from "@/features/executions/lib/executor-registry"
import { db } from "@/prisma/db"

import { inngest } from "./client"
import { topologicalSort } from "./utils"

/**
 * Inngest background function that runs a workflow end-to-end.
 *
 * Flow:
 *  1. Load the workflow with its nodes and connections.
 *  2. Topologically sort nodes to determine execution order.
 *  3. Execute nodes sequentially, threading a shared context between them.
 */
export const executeWorkflow = inngest.createFunction(
  { id: "execute-workflow", triggers: { event: "workflows/execute.workflow" } },
  async ({ event, step }) => {
    const workflowId = event.data.workflowId

    // Fail fast if the event payload is malformed
    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is missing")
    }

    // Step 1 & 2: Fetch workflow definition and compute execution order
    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await db.orm.public.Workflow.where({
        id: workflowId,
      })
        .include("nodes", (node) =>
          node.select(
            "id",
            "workflowId",
            "name",
            "type",
            "position",
            "data",
            "credentialId",
            "createdAt",
            "updatedAt"
          )
        )
        .include("connections", (conn) =>
          conn.select(
            "id",
            "workflowId",
            "fromNodeId",
            "toNodeId",
            "fromOutput",
            "toInput",
            "createdAt",
            "updatedAt"
          )
        )
        .first()

      if (!workflow) {
        throw new NonRetriableError("Workflow not found")
      }

      const sorted = topologicalSort(workflow.nodes, workflow.connections)

      // Return only serializable fields — Inngest persists step output as JSON
      return sorted.map((node) => ({
        id: node.id,
        type: node.type,
        data: node.data as Record<string, unknown>,
      }))
    })

    // Seed context with any data supplied by the triggering event
    let context = event.data.initialData ?? {}

    // Step 3: Execute nodes in topological order, propagating context
    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType)
      context = await executor({
        data: node.data,
        nodeId: node.id,
        context,
        step,
      })
    }

    return {
      workflowId,
      result: context,
    }
  }
)
