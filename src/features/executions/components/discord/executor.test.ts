import { NonRetriableError } from "inngest"
import ky from "ky"
import assert from "node:assert"
import { describe, it } from "node:test"

import { discordChannel } from "@/inngest/channels/discord"

import {
  createEmptyStepMock,
  createFailingStepMock,
  createPassthroughStepMock,
  createPublishMock,
} from "../executor-test-helpers"

import { discordExecutor } from "./executor"

describe("discordExecutor", () => {
  it("publishes error and throws NonRetriableError when content is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await discordExecutor({
          data: {
            variableName: "myDiscord",
            webhookUrl: "https://discord.com/api/webhooks/test",
          },
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
          "Discord node: Message content is required"
        )
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "discord-loading-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "discord-error-no-content-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws NonRetriableError when webhookUrl is missing inside step", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createPassthroughStepMock()

    await assert.rejects(
      async () => {
        await discordExecutor({
          data: {
            variableName: "myDiscord",
            content: "Hello Discord!",
          },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(err.message, "Discord node: Webhook URL is required")
        return true
      }
    )

    assert.strictEqual(published.length, 3)
    assert.deepStrictEqual(published[1], {
      id: "discord-error-no-webhook-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws NonRetriableError before step.run when variableName is missing", async (t) => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createPassthroughStepMock()

    let kyPostCalled = false
    t.mock.method(ky, "post", async () => {
      kyPostCalled = true
      return {} as unknown as Response
    })

    await assert.rejects(
      async () => {
        await discordExecutor({
          data: {
            content: "Hello Discord!",
            webhookUrl: "https://discord.com/api/webhooks/test",
          },
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
          "Discord node: Variable name is missing"
        )
        return true
      }
    )

    assert.strictEqual(kyPostCalled, false)
    assert.strictEqual(published.length, 3)
    assert.deepStrictEqual(published[1], {
      id: "discord-error-no-variable-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws NonRetriableError when webhookUrl is invalid", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createPassthroughStepMock()

    await assert.rejects(
      async () => {
        await discordExecutor({
          data: {
            variableName: "myDiscord",
            content: "Hello Discord!",
            webhookUrl: "http://evil.com/webhook",
          },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert(err.message.includes("Invalid webhook URL"))
        return true
      }
    )

    assert.strictEqual(published.length, 3)
    assert.deepStrictEqual(published[1], {
      id: "discord-error-invalid-webhook-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws NonRetriableError when template compilation fails", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createPassthroughStepMock()

    await assert.rejects(
      async () => {
        await discordExecutor({
          data: {
            variableName: "myDiscord",
            content: "Malformed {{#if unclosed}",
            webhookUrl: "https://discord.com/api/webhooks/test",
          },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert(err.message.includes("Template rendering failed"))
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "discord-loading-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "discord-error-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("successfully compiles Handlebars, unescapes HTML entities, posts via ky, and returns context with text and messageContent", async (t) => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createPassthroughStepMock()

    let capturedUrl = ""
    let capturedBody: unknown
    let capturedRedirect: string | undefined

    t.mock.method(
      ky,
      "post",
      async (url: string, options: { json: unknown; redirect?: string }) => {
        capturedUrl = url
        capturedBody = options.json
        capturedRedirect = options.redirect
        return {} as unknown as Response
      }
    )

    const context = {
      user: "Alice & Bob",
      data: { count: 42 },
    }

    const result = await discordExecutor({
      data: {
        variableName: "discordMsg",
        webhookUrl: "https://discord.com/api/webhooks/test-123",
        content: "Alert for {{user}}: {{json data}}",
        username: "Bot for {{user}}",
      },
      nodeId: "node-1",
      context,
      step: stepMock,
      publish: publishMock,
    })

    assert.strictEqual(capturedUrl, "https://discord.com/api/webhooks/test-123")
    assert.strictEqual(capturedRedirect, "error")
    assert.deepStrictEqual(capturedBody, {
      content: 'Alert for Alice & Bob: {\n  "count": 42\n}',
      username: "Bot for Alice & Bob",
    })

    assert.deepStrictEqual(result, {
      ...context,
      discordMsg: {
        text: 'Alert for Alice & Bob: {\n  "count": 42\n}',
        messageContent: 'Alert for Alice & Bob: {\n  "count": 42\n}',
      },
    })

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "discord-loading-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "discord-success-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "success" },
    })
  })

  it("publishes error status and re-throws when ky.post fails", async (t) => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createPassthroughStepMock()

    const networkError = new Error("Network timeout")
    t.mock.method(ky, "post", async () => {
      throw networkError
    })

    await assert.rejects(
      async () => {
        await discordExecutor({
          data: {
            variableName: "myDiscord",
            webhookUrl: "https://discord.com/api/webhooks/test",
            content: "Hello Discord!",
          },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert.strictEqual(err, networkError)
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[1], {
      id: "discord-error-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error status and re-throws when step.run throws", async () => {
    const { published, publishMock } = createPublishMock()
    const stepError = new Error("Step execution failed")
    const stepMock = createFailingStepMock(stepError)

    await assert.rejects(
      async () => {
        await discordExecutor({
          data: {
            variableName: "myDiscord",
            webhookUrl: "https://discord.com/api/webhooks/test",
            content: "Hello Discord!",
          },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert.strictEqual(err, stepError)
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[1], {
      id: "discord-error-node-1",
      topicRef: discordChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })
})
