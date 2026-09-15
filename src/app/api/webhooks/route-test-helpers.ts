import type { TestContext } from "node:test"

import { inngest } from "@/inngest/client"
import { db } from "@/prisma/db"

export interface MockWorkflow {
  userId: string
  [key: string]: unknown
}

/**
 * Mocks `db.orm.public.Workflow.where` to resolve with a workflow record
 * containing the specified `userId`.
 */
export function mockWorkflowFound(
  t: TestContext,
  workflow: MockWorkflow = { userId: "test-user-owner" }
) {
  return t.mock.method(db.orm.public.Workflow, "where", () => ({
    select: () => ({
      first: async () => workflow,
    }),
  }))
}

/**
 * Mocks `db.orm.public.Workflow.where` to resolve with `null` (workflow not found).
 */
export function mockWorkflowNotFound(t: TestContext) {
  return t.mock.method(db.orm.public.Workflow, "where", () => ({
    select: () => ({
      first: async () => null,
    }),
  }))
}

/**
 * Mocks `inngest.send` to resolve successfully with mock event IDs.
 */
export function mockInngestSend(
  t: TestContext,
  ids: string[] = ["evt_test_123"]
) {
  return t.mock.method(inngest, "send", async () => ({
    ids,
  }))
}

/**
 * Mocks `inngest.send` to throw an error (simulating Inngest dispatch failure).
 */
export function mockInngestSendFailure(
  t: TestContext,
  error: Error = new Error("Inngest unavailable")
) {
  return t.mock.method(inngest, "send", async () => {
    throw error
  })
}
