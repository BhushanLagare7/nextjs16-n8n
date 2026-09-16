import type { GetStepTools, Inngest, Realtime } from "inngest"

/** Shared, mutable data passed between nodes during a workflow run. */
export type WorkflowContext = Record<string, unknown>

/** Inngest step tools used to instrument node execution (step.run, etc.). */
export type StepTools = GetStepTools<Inngest.Any>

/**
 * Parameters provided to every node executor.
 * @template TData - Shape of the node-specific configuration data.
 */
export interface NodeExecutorParams<TData = Record<string, unknown>> {
  /** Node-specific configuration (e.g. HTTP endpoint, method). */
  data: TData
  /** Unique identifier of the node being executed. */
  nodeId: string
  /** ID of the user who owns the workflow, for scoping credential lookups. */
  userId?: string
  /** Accumulated workflow context from previously executed nodes. */
  context: WorkflowContext
  /** Inngest step helpers for durable execution. */
  step: StepTools
  /** Publishes a durable realtime message via step.realtime.publish. */
  publish: <T>(
    id: string,
    topicRef: Realtime.TopicRef<T>,
    data: T
  ) => Promise<void>
}

/**
 * Contract for a node executor: consumes params and returns the updated context.
 * @template TData - Shape of the node-specific configuration data.
 */
export type NodeExecutor<TData = Record<string, unknown>> = (
  params: NodeExecutorParams<TData>
) => Promise<WorkflowContext>
