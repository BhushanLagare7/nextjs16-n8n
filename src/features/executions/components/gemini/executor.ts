import { createGoogle } from "@ai-sdk/google"
import { generateText } from "ai"
import Handlebars from "handlebars"
import { NonRetriableError } from "inngest"

import { CredentialType } from "@/config/constants"
import type { NodeExecutor } from "@/features/executions/types"
import { geminiChannel } from "@/inngest/channels/gemini"
import { decrypt } from "@/lib/encryption"
import { db } from "@/prisma/db"

/** Stringifies a value for use inside Handlebars templates: `{{json value}}`. */
Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2)
  return new Handlebars.SafeString(jsonString)
})

type GeminiData = {
  variableName?: string
  credentialId?: string
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
 * @throws {NonRetriableError} If `variableName`, `credentialId`, or `userPrompt` is missing.
 */
export const geminiExecutor: NodeExecutor<GeminiData> = async ({
  data,
  nodeId,
  userId,
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

  if (!data.credentialId) {
    await publish(
      `gemini-error-no-credential-${nodeId}`,
      geminiChannel.status,
      { nodeId, status: "error" }
    )
    throw new NonRetriableError("Gemini node: Credential is required")
  }

  if (!data.userPrompt) {
    await publish(`gemini-error-no-prompt-${nodeId}`, geminiChannel.status, {
      nodeId,
      status: "error",
    })
    throw new NonRetriableError("Gemini node: User prompt is missing")
  }

  const credential = await step.run("get-credential", () => {
    return db.orm.public.Credential.where({
      id: data.credentialId,
      type: CredentialType.GEMINI,
      ...(userId ? { userId } : {}),
    }).first()
  })

  if (!credential) {
    await publish(
      `gemini-error-no-credential-found-${nodeId}`,
      geminiChannel.status,
      { nodeId, status: "error" }
    )
    throw new NonRetriableError("Gemini node: Credential not found")
  }

  const google = createGoogle({
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
      "gemini-generate-text",
      generateText,
      {
        model: google("gemini-2.5-flash"),
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
