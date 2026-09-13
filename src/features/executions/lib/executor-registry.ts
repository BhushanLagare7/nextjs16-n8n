import { NodeType } from "@/config/constants"
import { googleFormTriggerExecutor } from "@/features/triggers/components/google-form-trigger/executor"
import { manualTriggerExecutor } from "@/features/triggers/components/manual-trigger/executor"
import { stripeTriggerExecutor } from "@/features/triggers/components/stripe-trigger/executor"

import { anthropicExecutor } from "../components/anthropic/executor"
import { geminiExecutor } from "../components/gemini/executor"
import { httpRequestExecutor } from "../components/http-request/executor"
import { openAiExecutor } from "../components/openai/executor"
import { NodeExecutor } from "../types"

/**
 * Maps each supported node type to its corresponding executor implementation.
 * Add new node executors here to make them runnable in a workflow.
 */
export const executorRegistry: Partial<Record<NodeType, NodeExecutor>> = {
  [NodeType.INITIAL]: manualTriggerExecutor,
  [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
  [NodeType.HTTP_REQUEST]: httpRequestExecutor,
  [NodeType.GOOGLE_FORM_TRIGGER]: googleFormTriggerExecutor,
  [NodeType.STRIPE_TRIGGER]: stripeTriggerExecutor,
  [NodeType.GEMINI]: geminiExecutor,
  [NodeType.ANTHROPIC]: anthropicExecutor,
  [NodeType.OPENAI]: openAiExecutor,
}

/**
 * Resolves the executor for a given node type.
 * @throws If no executor is registered for the provided type.
 */
export const getExecutor = (type: NodeType): NodeExecutor => {
  const executor = executorRegistry[type]
  if (!executor) {
    throw new Error(`No executor found for node type: ${type}`)
  }

  return executor
}
