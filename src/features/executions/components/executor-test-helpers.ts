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

export interface AiWrapSuccessStepMock {
  stepMock: StepTools
  getWrapStepName: () => string
  readonly wrapStepName: string
}

/**
 * Creates a StepTools mock configured for a successful `step.ai.wrap` execution.
 * Tracks the step name passed to `wrap` and returns the provided response text.
 */
export function createAiWrapSuccessStepMock(
  responseText: string
): AiWrapSuccessStepMock {
  let wrapStepName = ""
  const stepMock = {
    ai: {
      wrap: async (stepName: string) => {
        wrapStepName = stepName
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
  }
}

/**
 * Creates a StepTools mock configured to throw an error when `step.ai.wrap` is called.
 */
export function createAiWrapErrorStepMock(error: Error): StepTools {
  return {
    ai: {
      wrap: async () => {
        throw error
      },
    },
  } as unknown as StepTools
}
