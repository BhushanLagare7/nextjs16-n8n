// src/inngest/functions.ts
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogle } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import * as Sentry from "@sentry/nextjs"
import { generateText } from "ai"

import { inngest } from "./client"

// Initialize AI SDK providers
const google = createGoogle()
const openai = createOpenAI()
const anthropic = createAnthropic()

/**
 * Inngest background workflow to execute sequential text generation
 * across multiple AI models (Gemini, OpenAI, Claude) using instrumented steps.
 */
export const execute = inngest.createFunction(
  { id: "execute-ai", triggers: { event: "execute/ai" } },
  async ({ event, step }) => {
    // Group related LLM calls into a single conversation thread in Sentry
    const conversationId =
      (event.data?.conversationId as string) || `conv-${event.id || Date.now()}`
    Sentry.setConversationId(conversationId)

    // Identify user in Sentry for conversation attribution
    if (event.data?.userId) {
      Sentry.setUser({
        id: event.data.userId as string,
        email: event.data.email as string | undefined,
      })
    }

    // Simulated delay
    await step.sleep("pretend", "5s")

    // 1. Generate text using Google Gemini
    const { steps: geminiSteps } = await step.ai.wrap(
      "gemini-generate-text",
      generateText,
      {
        model: google("gemini-2.5-flash"),
        instructions: "You are a helpful assistant.",
        prompt: "What is 2 + 2?",
        experimental_telemetry: {
          isEnabled: true,
          functionId: "gemini_generate_text",
          recordInputs: true,
          recordOutputs: true,
        },
      }
    )

    // 2. Generate text using OpenAI GPT-4
    const { steps: openaiSteps } = await step.ai.wrap(
      "openai-generate-text",
      generateText,
      {
        model: openai("gpt-4"),
        instructions: "You are a helpful assistant.",
        prompt: "What is 2 + 2?",
        experimental_telemetry: {
          isEnabled: true,
          functionId: "openai_generate_text",
          recordInputs: true,
          recordOutputs: true,
        },
      }
    )

    // 3. Generate text using Anthropic Claude
    const { steps: anthropicSteps } = await step.ai.wrap(
      "anthropic-generate-text",
      generateText,
      {
        model: anthropic("claude-sonnet-4-5"),
        instructions: "You are a helpful assistant.",
        prompt: "What is 2 + 2?",
        experimental_telemetry: {
          isEnabled: true,
          functionId: "anthropic_generate_text",
          recordInputs: true,
          recordOutputs: true,
        },
      }
    )

    return {
      geminiSteps,
      openaiSteps,
      anthropicSteps,
    }
  }
)
