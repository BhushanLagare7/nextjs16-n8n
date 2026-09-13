import { createGoogle } from "@ai-sdk/google"
import { generateText } from "ai"
import Handlebars from "handlebars"
import { NonRetriableError } from "inngest"

import type { NodeExecutor } from "@/features/executions/types"
import { geminiChannel } from "@/inngest/channels/gemini"

/** Stringifies a value for use inside Handlebars templates: `{{json value}}`. */
Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2)
  return new Handlebars.SafeString(jsonString)
})

type GeminiData = {
  variableName?: string
  systemPrompt?: string
  userPrompt?: string
}

/**
 * Executes a Gemini text generation node.
 *
 * Compiles the system/user prompts with the current execution context via
 * Handlebars, calls Gemini, and returns the context extended with the
 * generated text under `data.variableName`.
 *
 * @throws {NonRetriableError} If `variableName` or `userPrompt` is missing.
 */
export const geminiExecutor: NodeExecutor<GeminiData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(`gemini-loading-${nodeId}`, geminiChannel.status, {
    nodeId,
    status: "loading",
  })

  if (!data.variableName) {
    await publish(`gemini-error-no-variable-${nodeId}`, geminiChannel.status, {
      nodeId,
      status: "error",
    })
    throw new NonRetriableError("Gemini node: Variable name is missing")
  }

  if (!data.userPrompt) {
    await publish(`gemini-error-no-prompt-${nodeId}`, geminiChannel.status, {
      nodeId,
      status: "error",
    })
    throw new NonRetriableError("Gemini node: User prompt is missing")
  }

  // TODO: Throw if credential is missing

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant."
  const userPrompt = Handlebars.compile(data.userPrompt)(context)

  // TODO: Fetch credential that user selected

  const credentialValue = process.env.GOOGLE_GENERATIVE_AI_API_KEY!

  const google = createGoogle({
    apiKey: credentialValue,
  })

  try {
    const { steps, text: directText } = await step.ai.wrap(
      "gemini-generate-text",
      generateText,
      {
        model: google("gemini-2.0-flash"),
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

    await publish(`gemini-success-${nodeId}`, geminiChannel.status, {
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
    await publish(`gemini-error-${nodeId}`, geminiChannel.status, {
      nodeId,
      status: "error",
    })
    throw error
  }
}
