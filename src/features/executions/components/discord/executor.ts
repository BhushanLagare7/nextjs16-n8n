import Handlebars from "handlebars"
import { decode } from "html-entities"
import { NonRetriableError } from "inngest"
import ky from "ky"

import type { NodeExecutor } from "@/features/executions/types"
import { discordChannel } from "@/inngest/channels/discord"

/** Stringifies a value as pretty-printed JSON for use in templates. */
Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2)
  return new Handlebars.SafeString(jsonString)
})

type DiscordData = {
  variableName?: string
  webhookUrl?: string
  content?: string
  username?: string
}

/**
 * Executes a Discord node by posting a message to a Discord webhook URL.
 *
 * Resolves Handlebars templates in content and username, unescapes HTML entities,
 * posts the payload inside an Inngest step for durability, and returns updated context.
 */
export const discordExecutor: NodeExecutor<DiscordData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(`discord-loading-${nodeId}`, discordChannel.status, {
    nodeId,
    status: "loading",
  })

  if (!data.content) {
    await publish(`discord-error-no-content-${nodeId}`, discordChannel.status, {
      nodeId,
      status: "error",
    })
    throw new NonRetriableError("Discord node: Message content is required")
  }

  const rawContent = Handlebars.compile(data.content)(context)
  const content = decode(rawContent)
  const username = data.username
    ? decode(Handlebars.compile(data.username)(context))
    : undefined

  try {
    const result = await step.run("discord-webhook", async () => {
      if (!data.webhookUrl) {
        await publish(
          `discord-error-no-webhook-${nodeId}`,
          discordChannel.status,
          {
            nodeId,
            status: "error",
          }
        )
        throw new NonRetriableError("Discord node: Webhook URL is required")
      }

      await ky.post(data.webhookUrl, {
        json: {
          content: content.slice(0, 2000), // Discord's max message length
          username,
        },
      })

      if (!data.variableName) {
        await publish(
          `discord-error-no-variable-${nodeId}`,
          discordChannel.status,
          {
            nodeId,
            status: "error",
          }
        )
        throw new NonRetriableError("Discord node: Variable name is missing")
      }

      return {
        ...context,
        [data.variableName]: {
          text: content.slice(0, 2000),
          messageContent: content.slice(0, 2000),
        },
      }
    })

    await publish(`discord-success-${nodeId}`, discordChannel.status, {
      nodeId,
      status: "success",
    })

    return result
  } catch (error) {
    await publish(`discord-error-${nodeId}`, discordChannel.status, {
      nodeId,
      status: "error",
    })
    throw error
  }
}
