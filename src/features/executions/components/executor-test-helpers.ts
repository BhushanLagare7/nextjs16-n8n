import type { StepTools } from "@/features/executions/types"

export interface PublishedEvent<T = unknown> {
  id: string
  topicRef: unknown
  data: T
}

export interface PublishMockResult {
  published: Array<PublishedEvent>
  publishMock: <T>(id: string, topicRef: unknown, data: T) => Promise<void>
}

/**
 * Creates a mock for the `publish` function and an array that records
 * all published realtime events.
 */
export function createPublishMock(): PublishMockResult {
  const published: Array<PublishedEvent> = []
  const publishMock = async <T>(
    id: string,
    topicRef: unknown,
    data: T
  ): Promise<void> => {
    published.push({ id, topicRef, data })
  }

  return { published, publishMock }
}

/**
 * Creates an empty StepTools mock object for tests that do not invoke step methods.
 */
export function createEmptyStepMock(): StepTools {
  return {} as StepTools
}

export const createStepMock = createEmptyStepMock

const defaultMockCredential = {
  id: "test-credential-id",
  name: "Test Credential",
  value: "test-api-key",
  type: "OPENAI",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: "user-1",
}

/**
 * Creates a StepTools mock with `step.run` that returns a mock credential for `"get-credential"`.
 */
export function createStepWithCredentialMock(
  credential = defaultMockCredential
): StepTools {
  return {
    run: (async (name: string, fn: () => unknown) => {
      if (name === "get-credential") {
        return credential
      }
      return fn()
    }) as StepTools["run"],
  } as unknown as StepTools
}

export interface AiWrapSuccessStepMock<TOptions = Record<string, unknown>> {
  stepMock: StepTools
  getWrapStepName: () => string
  readonly wrapStepName: string
  getWrapOptions: () => TOptions | undefined
}

/**
 * Creates a StepTools mock configured for a successful `step.ai.wrap` execution.
 * Tracks the step name passed to `wrap` and returns the provided response text.
 */
export function createAiWrapSuccessStepMock<TOptions = Record<string, unknown>>(
  responseText: string
): AiWrapSuccessStepMock<TOptions> {
  let wrapStepName = ""
  let wrapOptions: TOptions | undefined
  const stepMock = {
    run: (async (name: string, fn: () => unknown) => {
      if (name === "get-credential") {
        return defaultMockCredential
      }
      return fn()
    }) as StepTools["run"],
    ai: {
      wrap: async (stepName: string, _fn?: unknown, options?: TOptions) => {
        wrapStepName = stepName
        wrapOptions = options
        return {
          text: responseText,
          steps: [
            {
              content: [{ type: "text", text: responseText }],
            },
          ],
        }
      },
    },
  } as unknown as StepTools

  return {
    stepMock,
    getWrapStepName: () => wrapStepName,
    get wrapStepName() {
      return wrapStepName
    },
    getWrapOptions: () => wrapOptions,
  }
}

/**
 * Creates a StepTools mock configured to throw an error when `step.ai.wrap` is called.
 */
export function createAiWrapErrorStepMock(error: Error): StepTools {
  return {
    run: (async (name: string, fn: () => unknown) => {
      if (name === "get-credential") {
        return defaultMockCredential
      }
      return fn()
    }) as StepTools["run"],
    ai: {
      wrap: async () => {
        throw error
      },
    },
  } as unknown as StepTools
}
