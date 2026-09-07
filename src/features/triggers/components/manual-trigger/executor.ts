import type { NodeExecutor } from "@/features/executions/types"

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
}) => {
  // TODO: Publish "loading" state for manual trigger

  // Wrap in step.run so the trigger is recorded as a durable step
  const result = await step.run("manual-trigger", async () => context)

  // TODO: Publish "success" state for manual trigger

  return result
}
