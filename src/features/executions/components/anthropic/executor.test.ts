import { NonRetriableError } from "inngest"
import assert from "node:assert"
import { describe, it } from "node:test"

import type { StepTools } from "@/features/executions/types"
import { anthropicChannel } from "@/inngest/channels/anthropic"
import { db } from "@/prisma/db"

import {
  createAiWrapErrorStepMock,
  createAiWrapSuccessStepMock,
  createEmptyStepMock,
  createPublishMock,
  createStepWithCredentialMock,
} from "../executor-test-helpers"

import { anthropicExecutor } from "./executor"

describe("anthropicExecutor", () => {
  it("publishes error and throws when variableName is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await anthropicExecutor({
          data: { userPrompt: "Hello", credentialId: "cred-1" },
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

  it("publishes error and throws when credentialId is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await anthropicExecutor({
          data: { variableName: "myAnthropic", userPrompt: "Hello" },
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
          "Anthropic node: Credential is required"
        )
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[1], {
      id: "anthropic-error-no-credential-node-1",
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
          data: { variableName: "myAnthropic", credentialId: "cred-1" },
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
    const { published, publishMock } = createPublishMock()
    const { stepMock, getWrapStepName } = createAiWrapSuccessStepMock(
      "Anthropic generated response"
    )

    const result = await anthropicExecutor({
      data: {
        variableName: "aiResult",
        credentialId: "cred-1",
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
    const { published, publishMock } = createPublishMock()
    const testError = new Error("Anthropic API call failed")
    const stepMock = createAiWrapErrorStepMock(testError)

    await assert.rejects(
      async () => {
        await anthropicExecutor({
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
      id: "anthropic-error-node-fail",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-fail", status: "error" },
    })
  })

  it("compiles prompts without HTML escaping (noEscape: true)", async () => {
    const { publishMock } = createPublishMock()
    const { stepMock, getWrapOptions } = createAiWrapSuccessStepMock<{
      instructions?: string
      prompt?: string
    }>("Anthropic response")

    await anthropicExecutor({
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
        await anthropicExecutor({
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
      id: "anthropic-loading-node-syntax-error",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-syntax-error", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "anthropic-error-node-syntax-error",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-syntax-error", status: "error" },
    })
  })

  it("publishes error status and throws NonRetriableError when credential is not found in DB", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createStepWithCredentialMock(
      undefined as unknown as Parameters<typeof createStepWithCredentialMock>[0]
    )
    // Override step.run to return null for get-credential
    ;(stepMock as unknown as Record<string, unknown>).run = async (
      name: string,
      fn: () => unknown
    ) => {
      if (name === "get-credential") return null
      return fn()
    }

    await assert.rejects(
      async () => {
        await anthropicExecutor({
          data: {
            variableName: "aiResult",
            credentialId: "cred-missing",
            userPrompt: "Hello",
          },
          nodeId: "node-no-cred",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(err.message, "Anthropic node: Credential not found")
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "anthropic-loading-node-no-cred",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-no-cred", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "anthropic-error-no-credential-found-node-no-cred",
      topicRef: anthropicChannel.status,
      data: { nodeId: "node-no-cred", status: "error" },
    })
  })

  it("passes userId to credential query when provided", async (t) => {
    const { publishMock } = createPublishMock()

    const stepMock = {
      run: async (_name: string, fn: () => unknown) => fn(),
      ai: {
        wrap: async () => ({
          text: "response",
          steps: [{ content: [{ type: "text", text: "response" }] }],
        }),
      },
    } as unknown as StepTools

    const whereMock = t.mock.method(db.orm.public.Credential, "where", () => ({
      first: async () => ({ id: "cred-1", value: "key-123" }),
    }))

    await anthropicExecutor({
      data: {
        variableName: "aiResult",
        credentialId: "cred-1",
        userPrompt: "Hello",
      },
      nodeId: "node-user",
      userId: "user-123",
      context: {},
      step: stepMock,
      publish: publishMock,
    })

    assert.strictEqual(whereMock.mock.calls.length, 1)
    const callArg = whereMock.mock.calls[0]?.arguments[0] as Record<
      string,
      unknown
    >
    assert.strictEqual(callArg.userId, "user-123")
    assert.strictEqual(callArg.type, "ANTHROPIC")
  })
})
