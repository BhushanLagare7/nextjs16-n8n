// src/inngest/functions.ts
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogle } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
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
  async ({ step }) => {
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
      }
    )

    return {
      geminiSteps,
      openaiSteps,
      anthropicSteps,
    }
  }
)
