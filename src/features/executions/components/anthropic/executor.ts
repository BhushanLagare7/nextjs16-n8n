import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import Handlebars from "handlebars"
import { NonRetriableError } from "inngest"

import type { NodeExecutor } from "@/features/executions/types"
import { anthropicChannel } from "@/inngest/channels/anthropic"

/** Stringifies a value for use inside Handlebars templates: `{{json value}}`. */
Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2)
  return new Handlebars.SafeString(jsonString)
})

type AnthropicData = {
  variableName?: string
  systemPrompt?: string
  userPrompt?: string
}

/**
 * Executes an Anthropic text generation node.
 *
 * Compiles the system/user prompts with the current execution context via
 * Handlebars, calls Claude, and returns the context extended with the
 * generated text under `data.variableName`.
 *
 * @throws {NonRetriableError} If `variableName` or `userPrompt` is missing.
 */
export const anthropicExecutor: NodeExecutor<AnthropicData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(`anthropic-loading-${nodeId}`, anthropicChannel.status, {
    nodeId,
    status: "loading",
  })

  if (!data.variableName) {
    await publish(
      `anthropic-error-no-variable-${nodeId}`,
      anthropicChannel.status,
      { nodeId, status: "error" }
    )
    throw new NonRetriableError("Anthropic node: Variable name is missing")
  }

  if (!data.userPrompt) {
    await publish(
      `anthropic-error-no-prompt-${nodeId}`,
      anthropicChannel.status,
      { nodeId, status: "error" }
    )
    throw new NonRetriableError("Anthropic node: User prompt is missing")
  }

  // TODO: Throw if credential is missing

  // TODO: Fetch credential that user selected

  const credentialValue = process.env.ANTHROPIC_API_KEY!

  const anthropic = createAnthropic({
    apiKey: credentialValue,
  })

  try {
    const systemPrompt = data.systemPrompt
      ? Handlebars.compile(data.systemPrompt, { noEscape: true })(context)
      : "You are a helpful assistant."
    const userPrompt = Handlebars.compile(data.userPrompt, {
      noEscape: true,
    })(context)

    const { steps, text: directText } = await step.ai.wrap(
      "anthropic-generate-text",
      generateText,
      {
        model: anthropic("claude-sonnet-4-5"),
        instructions: systemPrompt,
        prompt: userPrompt,
        telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      }
    )

    // Some providers return text only inside steps rather than at the top level.
    const text =
      directText ??
      (steps?.[0]?.content?.[0]?.type === "text"
        ? steps[0].content[0].text
        : "")

    await publish(`anthropic-success-${nodeId}`, anthropicChannel.status, {
      nodeId,
      status: "success",
    })

    return {
      ...context,
      [data.variableName]: {
        text,
      },
    }
  } catch (error) {
    await publish(`anthropic-error-${nodeId}`, anthropicChannel.status, {
      nodeId,
      status: "error",
    })
    throw error
  }
}
