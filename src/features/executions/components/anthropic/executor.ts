import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import Handlebars from "handlebars"
import { NonRetriableError } from "inngest"

import { CredentialType } from "@/config/constants"
import type { NodeExecutor } from "@/features/executions/types"
import { anthropicChannel } from "@/inngest/channels/anthropic"
import { decrypt } from "@/lib/encryption"
import { db } from "@/prisma/db"

/** Stringifies a value for use inside Handlebars templates: `{{json value}}`. */
Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2)
  return new Handlebars.SafeString(jsonString)
})

type AnthropicData = {
  variableName?: string
  credentialId?: string
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
 * @throws {NonRetriableError} If `variableName`, `credentialId`, or `userPrompt` is missing.
 */
export const anthropicExecutor: NodeExecutor<AnthropicData> = async ({
  data,
  nodeId,
  userId,
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

  if (!data.credentialId) {
    await publish(
      `anthropic-error-no-credential-${nodeId}`,
      anthropicChannel.status,
      { nodeId, status: "error" }
    )
    throw new NonRetriableError("Anthropic node: Credential is required")
  }

  if (!data.userPrompt) {
    await publish(
      `anthropic-error-no-prompt-${nodeId}`,
      anthropicChannel.status,
      { nodeId, status: "error" }
    )
    throw new NonRetriableError("Anthropic node: User prompt is missing")
  }

  const credential = await step.run("get-credential", () => {
    return db.orm.public.Credential.where({
      id: data.credentialId,
      type: CredentialType.ANTHROPIC,
      ...(userId ? { userId } : {}),
    }).first()
  })

  if (!credential) {
    await publish(
      `anthropic-error-no-credential-found-${nodeId}`,
      anthropicChannel.status,
      { nodeId, status: "error" }
    )
    throw new NonRetriableError("Anthropic node: Credential not found")
  }

  const anthropic = createAnthropic({
    apiKey: decrypt(credential.value),
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
