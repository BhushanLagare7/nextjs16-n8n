import assert from "node:assert"
import { describe, it } from "node:test"

import type { StepTools } from "@/features/executions/types"
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger"

import { googleFormTriggerExecutor } from "./executor"

describe("googleFormTriggerExecutor", () => {
  it("publishes loading, executes step.run, publishes success, and returns context", async () => {
    const published: Array<{ id: string; topicRef: unknown; data: unknown }> =
      []
    const publishMock = async <T>(id: string, topicRef: unknown, data: T) => {
      published.push({ id, topicRef, data })
    }

    const stepMock: StepTools = {
      run: (async <T>(_name: string, fn: () => Promise<T>): Promise<T> => {
        return fn()
      }) as StepTools["run"],
    } as StepTools

    const initialContext = {
      googleForm: {
        formId: "form-1",
        respondentEmail: "user@example.com",
      },
    }

    const result = await googleFormTriggerExecutor({
      data: {},
      nodeId: "node-1",
      context: initialContext,
      step: stepMock,
      publish: publishMock,
    })

    assert.deepStrictEqual(result, initialContext)
    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "google-form-trigger-loading-node-1",
      topicRef: googleFormTriggerChannel.status,
      data: { nodeId: "node-1", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "google-form-trigger-success-node-1",
      topicRef: googleFormTriggerChannel.status,
      data: { nodeId: "node-1", status: "success" },
    })
  })

  it("publishes error status and re-throws when step.run throws", async () => {
    const published: Array<{ id: string; topicRef: unknown; data: unknown }> =
      []
    const publishMock = async <T>(id: string, topicRef: unknown, data: T) => {
      published.push({ id, topicRef, data })
    }

    const testError = new Error("Step failed")
    const stepMock: StepTools = {
      run: (async (): Promise<never> => {
        throw testError
      }) as StepTools["run"],
    } as StepTools

    await assert.rejects(
      async () => {
        await googleFormTriggerExecutor({
          data: {},
          nodeId: "node-2",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert.strictEqual(err, testError)
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[1], {
      id: "google-form-trigger-error-node-2",
      topicRef: googleFormTriggerChannel.status,
      data: { nodeId: "node-2", status: "error" },
    })
  })
})
