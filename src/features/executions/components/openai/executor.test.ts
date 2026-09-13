import { NonRetriableError } from "inngest"
import assert from "node:assert"
import { describe, it } from "node:test"

import { openAiChannel } from "@/inngest/channels/openai"

import {
  createAiWrapErrorStepMock,
  createAiWrapSuccessStepMock,
  createEmptyStepMock,
  createPublishMock,
} from "../executor-test-helpers"

import { openAiExecutor } from "./executor"

describe("openAiExecutor", () => {
  it("publishes error and throws when variableName is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await openAiExecutor({
          data: { userPrompt: "Hello" },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(err.message, "OpenAi node: Variable name is missing")
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "openai-loading-node-1",
      topicRef: openAiChannel.status,
      data: { nodeId: "node-1", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "openai-error-no-variable-node-1",
      topicRef: openAiChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws when userPrompt is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await openAiExecutor({
          data: { variableName: "myOpenAi" },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(err.message, "OpenAi node: User prompt is missing")
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[1], {
      id: "openai-error-no-prompt-node-1",
      topicRef: openAiChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("executes step.ai.wrap, publishes success, and returns context with text", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key"

    const { published, publishMock } = createPublishMock()
    const { stepMock, getWrapStepName } = createAiWrapSuccessStepMock(
      "OpenAI generated response"
    )

    const result = await openAiExecutor({
      data: {
        variableName: "aiResult",
        systemPrompt: "You are an assistant.",
        userPrompt: "Analyze {{data}}",
      },
      nodeId: "node-openai",
      context: { data: "sample data" },
      step: stepMock,
      publish: publishMock,
    })

    assert.strictEqual(getWrapStepName(), "openai-generate-text")
    assert.deepStrictEqual(result, {
      data: "sample data",
      aiResult: {
        text: "OpenAI generated response",
      },
    })
    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "openai-loading-node-openai",
      topicRef: openAiChannel.status,
      data: { nodeId: "node-openai", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "openai-success-node-openai",
      topicRef: openAiChannel.status,
      data: { nodeId: "node-openai", status: "success" },
    })
  })

  it("publishes error status and re-throws when step.ai.wrap fails", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key"

    const { published, publishMock } = createPublishMock()
    const testError = new Error("OpenAI API call failed")
    const stepMock = createAiWrapErrorStepMock(testError)

    await assert.rejects(
      async () => {
        await openAiExecutor({
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
      id: "openai-error-node-fail",
      topicRef: openAiChannel.status,
      data: { nodeId: "node-fail", status: "error" },
    })
  })
})
