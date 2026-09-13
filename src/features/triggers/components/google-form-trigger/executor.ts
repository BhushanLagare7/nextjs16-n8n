import type { NodeExecutor } from "@/features/executions/types"
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger"

type GoogleFormTriggerData = Record<string, unknown>

/**
 * Executor for Google Form trigger nodes.
 * Forwards the incoming workflow context (populated with the form
 * submission payload) to downstream nodes, publishing status updates
 * throughout execution.
 */
export const googleFormTriggerExecutor: NodeExecutor<
  GoogleFormTriggerData
> = async ({ nodeId, context, step, publish }) => {
  await publish(
    `google-form-trigger-loading-${nodeId}`,
    googleFormTriggerChannel.status,
    { nodeId, status: "loading" }
  )

  try {
    const result = await step.run("google-form-trigger", async () => context)

    await publish(
      `google-form-trigger-success-${nodeId}`,
      googleFormTriggerChannel.status,
      { nodeId, status: "success" }
    )

    return result
  } catch (error) {
    try {
      await publish(
        `google-form-trigger-error-${nodeId}`,
        googleFormTriggerChannel.status,
        { nodeId, status: "error" }
      )
    } catch (publishError) {
      console.error(
        "Failed to publish error status for google-form-trigger:",
        publishError
      )
    }
    throw error
  }
}
