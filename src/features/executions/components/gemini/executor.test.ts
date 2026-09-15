import { NonRetriableError } from "inngest"
import assert from "node:assert"
import { describe, it } from "node:test"

import { geminiChannel } from "@/inngest/channels/gemini"

import {
  createAiWrapErrorStepMock,
  createAiWrapSuccessStepMock,
  createEmptyStepMock,
  createPublishMock,
  createStepWithCredentialMock,
} from "../executor-test-helpers"

import { geminiExecutor } from "./executor"

describe("geminiExecutor", () => {
  it("publishes error and throws when variableName is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await geminiExecutor({
          data: { userPrompt: "Hello", credentialId: "cred-1" },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(err.message, "Gemini node: Variable name is missing")
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "gemini-loading-node-1",
      topicRef: geminiChannel.status,
      data: { nodeId: "node-1", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "gemini-error-no-variable-node-1",
      topicRef: geminiChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws when credentialId is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await geminiExecutor({
          data: { variableName: "myGemini", userPrompt: "Hello" },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(err.message, "Gemini node: Credential is required")
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[1], {
      id: "gemini-error-no-credential-node-1",
      topicRef: geminiChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws when userPrompt is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await geminiExecutor({
          data: { variableName: "myGemini", credentialId: "cred-1" },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(err.message, "Gemini node: User prompt is missing")
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[1], {
      id: "gemini-error-no-prompt-node-1",
      topicRef: geminiChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("executes step.ai.wrap, publishes success, and returns context with text", async () => {
    const { published, publishMock } = createPublishMock()
    const { stepMock, getWrapStepName } = createAiWrapSuccessStepMock(
      "Gemini generated response"
    )

    const result = await geminiExecutor({
      data: {
        variableName: "aiResult",
        credentialId: "cred-1",
        systemPrompt: "You are an assistant.",
        userPrompt: "Translate {{text}}",
      },
      nodeId: "node-gemini",
      context: { text: "Hello world" },
      step: stepMock,
      publish: publishMock,
    })

    assert.strictEqual(getWrapStepName(), "gemini-generate-text")
    assert.deepStrictEqual(result, {
      text: "Hello world",
      aiResult: {
        text: "Gemini generated response",
      },
    })
    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "gemini-loading-node-gemini",
      topicRef: geminiChannel.status,
      data: { nodeId: "node-gemini", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "gemini-success-node-gemini",
      topicRef: geminiChannel.status,
      data: { nodeId: "node-gemini", status: "success" },
    })
  })

  it("publishes error status and re-throws when step.ai.wrap fails", async () => {
    const { published, publishMock } = createPublishMock()
    const testError = new Error("Gemini API call failed")
    const stepMock = createAiWrapErrorStepMock(testError)

    await assert.rejects(
      async () => {
        await geminiExecutor({
          data: {
            variableName: "aiResult",
            credentialId: "cred-1",
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
      id: "gemini-error-node-fail",
      topicRef: geminiChannel.status,
      data: { nodeId: "node-fail", status: "error" },
    })
  })

  it("compiles prompts without HTML escaping (noEscape: true)", async () => {
    const { publishMock } = createPublishMock()
    const { stepMock, getWrapOptions } = createAiWrapSuccessStepMock<{
      instructions?: string
      prompt?: string
    }>("Gemini response")

    await geminiExecutor({
      data: {
        variableName: "aiResult",
        credentialId: "cred-1",
        systemPrompt: "Instructions with {{specialSys}}",
        userPrompt: "Prompt with {{specialUser}}",
      },
      nodeId: "node-no-escape",
      context: {
        specialSys: "<b>&'\"</b>",
        specialUser: "1 < 2 && 3 > 2",
      },
      step: stepMock,
      publish: publishMock,
    })

    const options = getWrapOptions()
    assert.strictEqual(options?.instructions, "Instructions with <b>&'\"</b>")
    assert.strictEqual(options?.prompt, "Prompt with 1 < 2 && 3 > 2")
  })

  it("publishes error status and re-throws when prompt contains invalid Handlebars syntax", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createStepWithCredentialMock()

    await assert.rejects(
      async () => {
        await geminiExecutor({
          data: {
            variableName: "aiResult",
            credentialId: "cred-1",
            userPrompt: "Hello {{unclosed",
          },
          nodeId: "node-syntax-error",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof Error)
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "gemini-loading-node-syntax-error",
      topicRef: geminiChannel.status,
      data: { nodeId: "node-syntax-error", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "gemini-error-node-syntax-error",
      topicRef: geminiChannel.status,
      data: { nodeId: "node-syntax-error", status: "error" },
    })
  })
})
