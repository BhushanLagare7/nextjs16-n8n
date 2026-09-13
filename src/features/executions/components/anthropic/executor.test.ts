import { NonRetriableError } from "inngest"
import assert from "node:assert"
import { describe, it } from "node:test"

import { anthropicChannel } from "@/inngest/channels/anthropic"

import {
  createAiWrapErrorStepMock,
  createAiWrapSuccessStepMock,
  createEmptyStepMock,
  createPublishMock,
} from "../executor-test-helpers"

import { anthropicExecutor } from "./executor"

describe("anthropicExecutor", () => {
  it("publishes error and throws when variableName is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await anthropicExecutor({
          data: { userPrompt: "Hello" },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(
          err.message,
          "Anthropic node: Variable name is missing"
        )
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "anthropic-loading-node-1",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-1", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "anthropic-error-no-variable-node-1",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws when userPrompt is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await anthropicExecutor({
          data: { variableName: "myAnthropic" },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(
          err.message,
          "Anthropic node: User prompt is missing"
        )
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[1], {
      id: "anthropic-error-no-prompt-node-1",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("executes step.ai.wrap, publishes success, and returns context with text", async () => {
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key"

    const { published, publishMock } = createPublishMock()
    const { stepMock, getWrapStepName } = createAiWrapSuccessStepMock(
      "Anthropic generated response"
    )

    const result = await anthropicExecutor({
      data: {
        variableName: "aiResult",
        systemPrompt: "You are an assistant.",
        userPrompt: "Hello {{name}}",
      },
      nodeId: "node-anthropic",
      context: { name: "Alice" },
      step: stepMock,
      publish: publishMock,
    })

    assert.strictEqual(getWrapStepName(), "anthropic-generate-text")
    assert.deepStrictEqual(result, {
      name: "Alice",
      aiResult: {
        text: "Anthropic generated response",
      },
    })
    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "anthropic-loading-node-anthropic",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-anthropic", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "anthropic-success-node-anthropic",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-anthropic", status: "success" },
    })
  })

  it("publishes error status and re-throws when step.ai.wrap fails", async () => {
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key"

    const { published, publishMock } = createPublishMock()
    const testError = new Error("Anthropic API call failed")
    const stepMock = createAiWrapErrorStepMock(testError)

    await assert.rejects(
      async () => {
        await anthropicExecutor({
          data: {
            variableName: "aiResult",
            userPrompt: "Hello",
          },
          nodeId: "node-fail",
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
      id: "anthropic-error-node-fail",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-fail", status: "error" },
    })
  })
})
