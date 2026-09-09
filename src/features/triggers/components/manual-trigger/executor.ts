import type { NodeExecutor } from "@/features/executions/types"
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger"

/** Manual triggers accept an arbitrary key/value payload. */
type ManualTriggerData = Record<string, unknown>

/**
 * Executor for manual trigger nodes.
 * Acts as a pass-through: forwards the incoming context downstream unchanged.
 */
export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    `manual-trigger-loading-${nodeId}`,
    manualTriggerChannel.status,
    { nodeId, status: "loading" }
  )

  try {
    // Wrap in step.run so the trigger is recorded as a durable step
    const result = await step.run("manual-trigger", async () => context)

    await publish(
      `manual-trigger-success-${nodeId}`,
      manualTriggerChannel.status,
      { nodeId, status: "success" }
    )

    return result
  } catch (error) {
    await publish(
      `manual-trigger-error-${nodeId}`,
      manualTriggerChannel.status,
      { nodeId, status: "error" }
    )
    throw error
  }
}
