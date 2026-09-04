import type { FieldOutputTypes } from "@/prisma/contract.d"

/**
 * Shared pagination defaults and limits used across
 * both client query params and server-side validation.
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
}

/**
 * Supported workflow node types matching the database schema in contract.prisma.
 * `satisfies` ensures every value is a valid `Node.type` at compile time.
 */
export const NodeType = {
  INITIAL: "INITIAL",
  MANUAL_TRIGGER: "MANUAL_TRIGGER",
  HTTP_REQUEST: "HTTP_REQUEST",
  GOOGLE_FORM_TRIGGER: "GOOGLE_FORM_TRIGGER",
  STRIPE_TRIGGER: "STRIPE_TRIGGER",
  ANTHROPIC: "ANTHROPIC",
  GEMINI: "GEMINI",
  OPENAI: "OPENAI",
  DISCORD: "DISCORD",
  SLACK: "SLACK",
} as const satisfies Record<string, FieldOutputTypes["public"]["Node"]["type"]>

/** Union of all node type string literals */
export type NodeType = (typeof NodeType)[keyof typeof NodeType]
