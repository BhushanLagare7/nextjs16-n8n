// src/inngest/functions.ts
import { NonRetriableError, type Realtime } from "inngest"

import { ExecutionStatus, NodeType } from "@/config/constants"
import { getExecutor } from "@/features/executions/lib/executor-registry"
import { db } from "@/prisma/db"

import { inngest } from "./client"
import { topologicalSort } from "./utils"

/**
 * Inngest background function that runs a workflow end-to-end.
 *
 * 1. Creates an execution record tracking workflow progress.
 * 2. Loads the workflow with its nodes and connections.
 * 3. Topologically sorts nodes to determine execution order.
 * 4. Executes nodes sequentially, threading a shared context between them.
 * 5. Updates execution status on success or failure.
 */
export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    triggers: [{ event: "workflows/execute.workflow" }],
    retries: 0,
    onFailure: async ({ event }) => {
      return db.orm.public.Execution.where({
        inngestEventId: event.data.event.id,
      }).update({
        status: ExecutionStatus.FAILED,
        error: event.data.error.message,
        errorStack: event.data.error.stack,
      })
    },
  },
  async ({ event, step }) => {
    const inngestEventId = event.id
    const workflowId = event.data.workflowId as string | undefined
    const userId = event.data.userId as string | undefined

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or workflow ID is missing")
    }

    await step.run("create-execution", async () => {
      return db.orm.public.Execution.create({
        workflowId,
        inngestEventId,
      })
    })

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
        userId,
        context,
        step,
        publish,
      })
    }

    await step.run("update-execution", async () => {
      return db.orm.public.Execution.where({
        inngestEventId,
        workflowId,
      }).update({
        status: ExecutionStatus.SUCCESS,
        completedAt: new Date().toISOString(),
        output: context,
      })
    })

    return {
      workflowId,
      result: context,
    }
  }
)
