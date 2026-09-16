import { NonRetriableError } from "inngest"
import ky from "ky"
import assert from "node:assert"
import { describe, it } from "node:test"

import { slackChannel } from "@/inngest/channels/slack"

import {
  createEmptyStepMock,
  createFailingStepMock,
  createPassthroughStepMock,
  createPublishMock,
} from "../executor-test-helpers"

import { slackExecutor } from "./executor"

describe("slackExecutor", () => {
  it("publishes error and throws NonRetriableError when content is missing", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createEmptyStepMock()

    await assert.rejects(
      async () => {
        await slackExecutor({
          data: {
            variableName: "mySlack",
            webhookUrl: "https://hooks.slack.com/services/test",
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
          "Slack node: Message content is required"
        )
        return true
      }
    )

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "slack-loading-node-1",
      topicRef: slackChannel.status,
      data: { nodeId: "node-1", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "slack-error-no-content-node-1",
      topicRef: slackChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws NonRetriableError when webhookUrl is missing inside step", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createPassthroughStepMock()

    await assert.rejects(
      async () => {
        await slackExecutor({
          data: {
            variableName: "mySlack",
            content: "Hello Slack!",
          },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(err.message, "Slack node: Webhook URL is required")
        return true
      }
    )

    assert.strictEqual(published.length, 3)
    assert.deepStrictEqual(published[1], {
      id: "slack-error-no-webhook-node-1",
      topicRef: slackChannel.status,
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
        await slackExecutor({
          data: {
            content: "Hello Slack!",
            webhookUrl: "https://hooks.slack.com/services/test",
          },
          nodeId: "node-1",
          context: {},
          step: stepMock,
          publish: publishMock,
        })
      },
      (err: unknown) => {
        assert(err instanceof NonRetriableError)
        assert.strictEqual(err.message, "Slack node: Variable name is missing")
        return true
      }
    )

    assert.strictEqual(kyPostCalled, false)
    assert.strictEqual(published.length, 3)
    assert.deepStrictEqual(published[1], {
      id: "slack-error-no-variable-node-1",
      topicRef: slackChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws NonRetriableError when webhookUrl is invalid", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createPassthroughStepMock()

    await assert.rejects(
      async () => {
        await slackExecutor({
          data: {
            variableName: "mySlack",
            content: "Hello Slack!",
            webhookUrl: "http://evil.com/services/test",
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
      id: "slack-error-invalid-webhook-node-1",
      topicRef: slackChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error and throws NonRetriableError when template compilation fails", async () => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createPassthroughStepMock()

    await assert.rejects(
      async () => {
        await slackExecutor({
          data: {
            variableName: "mySlack",
            content: "Malformed {{#if unclosed}",
            webhookUrl: "https://hooks.slack.com/services/test",
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
      id: "slack-loading-node-1",
      topicRef: slackChannel.status,
      data: { nodeId: "node-1", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "slack-error-node-1",
      topicRef: slackChannel.status,
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
      data: { count: 100 },
    }

    const result = await slackExecutor({
      data: {
        variableName: "slackMsg",
        webhookUrl: "https://hooks.slack.com/services/test-456",
        content: "Notification for {{user}}: {{json data}}",
      },
      nodeId: "node-1",
      context,
      step: stepMock,
      publish: publishMock,
    })

    assert.strictEqual(capturedUrl, "https://hooks.slack.com/services/test-456")
    assert.strictEqual(capturedRedirect, "error")
    assert.deepStrictEqual(capturedBody, {
      text: 'Notification for Alice & Bob: {\n  "count": 100\n}',
    })

    assert.deepStrictEqual(result, {
      ...context,
      slackMsg: {
        text: 'Notification for Alice & Bob: {\n  "count": 100\n}',
        messageContent: 'Notification for Alice & Bob: {\n  "count": 100\n}',
      },
    })

    assert.strictEqual(published.length, 2)
    assert.deepStrictEqual(published[0], {
      id: "slack-loading-node-1",
      topicRef: slackChannel.status,
      data: { nodeId: "node-1", status: "loading" },
    })
    assert.deepStrictEqual(published[1], {
      id: "slack-success-node-1",
      topicRef: slackChannel.status,
      data: { nodeId: "node-1", status: "success" },
    })
  })

  it("publishes error status and re-throws when ky.post fails", async (t) => {
    const { published, publishMock } = createPublishMock()
    const stepMock = createPassthroughStepMock()

    const networkError = new Error("Connection refused")
    t.mock.method(ky, "post", async () => {
      throw networkError
    })

    await assert.rejects(
      async () => {
        await slackExecutor({
          data: {
            variableName: "mySlack",
            webhookUrl: "https://hooks.slack.com/services/test",
            content: "Hello Slack!",
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
      id: "slack-error-node-1",
      topicRef: slackChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })

  it("publishes error status and re-throws when step.run throws", async () => {
    const { published, publishMock } = createPublishMock()
    const stepError = new Error("Step execution failed")
    const stepMock = createFailingStepMock(stepError)

    await assert.rejects(
      async () => {
        await slackExecutor({
          data: {
            variableName: "mySlack",
            webhookUrl: "https://hooks.slack.com/services/test",
            content: "Hello Slack!",
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
      id: "slack-error-node-1",
      topicRef: slackChannel.status,
      data: { nodeId: "node-1", status: "error" },
    })
  })
})
