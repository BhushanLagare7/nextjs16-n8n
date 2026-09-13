import type { NodeExecutor } from "@/features/executions/types"
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger"

type StripeTriggerData = Record<string, unknown>

/**
 * Executor for Stripe trigger nodes.
 * Forwards incoming workflow context (populated with Stripe webhook payload)
 * to downstream nodes, publishing status updates throughout execution.
 */
export const stripeTriggerExecutor: NodeExecutor<StripeTriggerData> = async ({
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    `stripe-trigger-loading-${nodeId}`,
    stripeTriggerChannel.status,
    { nodeId, status: "loading" }
  )

  try {
    const result = await step.run("stripe-trigger", async () => context)

    await publish(
      `stripe-trigger-success-${nodeId}`,
      stripeTriggerChannel.status,
      { nodeId, status: "success" }
    )

    return result
  } catch (error) {
    try {
      await publish(
        `stripe-trigger-error-${nodeId}`,
        stripeTriggerChannel.status,
        { nodeId, status: "error" }
      )
    } catch (publishError) {
      console.error(
        "Failed to publish error status for stripe-trigger:",
        publishError
      )
    }
    throw error
  }
}
