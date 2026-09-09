// src/inngest/functions.ts
import { NonRetriableError, type Realtime } from "inngest"

import { NodeType } from "@/config/constants"
import { getExecutor } from "@/features/executions/lib/executor-registry"
import { db } from "@/prisma/db"

import { inngest } from "./client"
import { topologicalSort } from "./utils"

/**
 * Inngest background function that runs a workflow end-to-end.
 *
 * 1. Loads the workflow with its nodes and connections.
 * 2. Topologically sorts nodes to determine execution order.
 * 3. Executes nodes sequentially, threading a shared context between them.
 */
export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    triggers: [{ event: "workflows/execute.workflow" }],
  },
  async ({ event, step }) => {
    const workflowId = event.data.workflowId

    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is missing")
    }

    /**
     * Publishes a realtime message via `step.realtime.publish`, so executors
     * don't need direct access to the step reference.
     */
    const publish = async <T>(
      id: string,
      topicRef: Realtime.TopicRef<T>,
      data: T
    ): Promise<void> => {
      await step.realtime.publish(id, topicRef, data)
    }

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

      // Only serializable fields are returned — Inngest persists step output as JSON
      return sorted.map((node) => ({
        id: node.id,
        type: node.type,
        data: node.data as Record<string, unknown>,
      }))
    })

    let context = event.data.initialData ?? {}

    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType)
      context = await executor({
        data: node.data,
        nodeId: node.id,
        context,
        step,
        publish,
      })
    }

    return {
      workflowId,
      result: context,
    }
  }
)
