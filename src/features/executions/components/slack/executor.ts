import Handlebars from "handlebars"
import { decode } from "html-entities"
import { NonRetriableError } from "inngest"
import ky from "ky"

import { validateSlackWebhookUrl } from "@/features/executions/lib/url-validation"
import type { NodeExecutor } from "@/features/executions/types"
import { slackChannel } from "@/inngest/channels/slack"

/** Stringifies a value as pretty-printed JSON for use in templates. */
Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2)
  return new Handlebars.SafeString(jsonString)
})

type SlackData = {
  variableName?: string
  webhookUrl?: string
  content?: string
}

/**
 * Executes a Slack node by posting a message to a Slack webhook URL.
 *
 * Resolves Handlebars templates in content, unescapes HTML entities,
 * posts the payload inside an Inngest step for durability, and returns updated context.
 */
export const slackExecutor: NodeExecutor<SlackData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(`slack-loading-${nodeId}`, slackChannel.status, {
    nodeId,
    status: "loading",
  })

  if (!data.content) {
    await publish(`slack-error-no-content-${nodeId}`, slackChannel.status, {
      nodeId,
      status: "error",
    })
    throw new NonRetriableError("Slack node: Message content is required")
  }

  try {
    if (!data.variableName) {
      await publish(`slack-error-no-variable-${nodeId}`, slackChannel.status, {
        nodeId,
        status: "error",
      })
      throw new NonRetriableError("Slack node: Variable name is missing")
    }
    const variableName = data.variableName

    let content: string
    try {
      const rawContent = Handlebars.compile(data.content)(context)
      content = decode(rawContent)
    } catch (error) {
      throw new NonRetriableError(
        `Slack node: Template rendering failed: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    }

    const result = await step.run("slack-webhook", async () => {
      if (!data.webhookUrl) {
        await publish(`slack-error-no-webhook-${nodeId}`, slackChannel.status, {
          nodeId,
          status: "error",
        })
        throw new NonRetriableError("Slack node: Webhook URL is required")
      }

      try {
        validateSlackWebhookUrl(data.webhookUrl)
      } catch (error) {
        await publish(
          `slack-error-invalid-webhook-${nodeId}`,
          slackChannel.status,
          {
            nodeId,
            status: "error",
          }
        )
        throw new NonRetriableError(
          `Slack node: Invalid webhook URL: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error }
        )
      }

      await ky.post(data.webhookUrl, {
        json: {
          text: content,
        },
        redirect: "error",
      })

      return {
        ...context,
        [variableName]: {
          text: content.slice(0, 2000),
          messageContent: content.slice(0, 2000),
        },
      }
    })

    await publish(`slack-success-${nodeId}`, slackChannel.status, {
      nodeId,
      status: "success",
    })

    return result
  } catch (error) {
    await publish(`slack-error-${nodeId}`, slackChannel.status, {
      nodeId,
      status: "error",
    })
    throw error
  }
}
