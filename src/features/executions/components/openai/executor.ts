import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"
import Handlebars from "handlebars"
import { NonRetriableError } from "inngest"

import { CredentialType } from "@/config/constants"
import type { NodeExecutor } from "@/features/executions/types"
import { openAiChannel } from "@/inngest/channels/openai"
import { decrypt } from "@/lib/encryption"
import { db } from "@/prisma/db"

/** Stringifies a value for use inside Handlebars templates: `{{json value}}`. */
Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2)
  return new Handlebars.SafeString(jsonString)
})

type OpenAiData = {
  variableName?: string
  credentialId?: string
  systemPrompt?: string
  userPrompt?: string
}

/**
 * Executes an OpenAI text generation node.
 *
 * Compiles the system/user prompts with the current execution context via
 * Handlebars, calls the OpenAI model, and returns the context extended with
 * the generated text under `data.variableName`.
 *
 * @throws {NonRetriableError} If `variableName`, `credentialId`, or `userPrompt` is missing.
 */
export const openAiExecutor: NodeExecutor<OpenAiData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(`openai-loading-${nodeId}`, openAiChannel.status, {
    nodeId,
    status: "loading",
  })

  if (!data.variableName) {
    await publish(`openai-error-no-variable-${nodeId}`, openAiChannel.status, {
      nodeId,
      status: "error",
    })
    throw new NonRetriableError("OpenAi node: Variable name is missing")
  }

  if (!data.credentialId) {
    await publish(
      `openai-error-no-credential-${nodeId}`,
      openAiChannel.status,
      { nodeId, status: "error" }
    )
    throw new NonRetriableError("OpenAI node: Credential is required")
  }

  if (!data.userPrompt) {
    await publish(`openai-error-no-prompt-${nodeId}`, openAiChannel.status, {
      nodeId,
      status: "error",
    })
    throw new NonRetriableError("OpenAi node: User prompt is missing")
  }

  const credential = await step.run("get-credential", () => {
    return db.orm.public.Credential.where({
      id: data.credentialId,
      type: CredentialType.OPENAI,
      ...(userId ? { userId } : {}),
    }).first()
  })

  if (!credential) {
    await publish(
      `openai-error-no-credential-found-${nodeId}`,
      openAiChannel.status,
      { nodeId, status: "error" }
    )
    throw new NonRetriableError("OpenAI node: Credential not found")
  }

  const openai = createOpenAI({
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
      "openai-generate-text",
      generateText,
      {
        model: openai("gpt-4"),
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

    await publish(`openai-success-${nodeId}`, openAiChannel.status, {
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
    await publish(`openai-error-${nodeId}`, openAiChannel.status, {
      nodeId,
      status: "error",
    })
    throw error
  }
}
