/**
 * @file Unit tests for `executionsRouter`.
 *
 * External collaborators (database ORM) are replaced with `node:test` mocks
 * so that every procedure can be exercised in isolation. All mocks are created
 * through the per-test `TestContext` (`t.mock`) and are therefore restored
 * automatically when each test ends.
 */

import { TRPCError } from "@trpc/server"
import assert from "node:assert"
import { describe, it } from "node:test"

import { PAGINATION } from "@/config/constants"
import { db } from "@/prisma/db"

import { executionsRouter } from "./routers"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_USER_ID = "test-user-id"
const OTHER_USER_ID = "other-user-id"

const timestamps = () => ({
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

const testAuth = {
  user: {
    id: TEST_USER_ID,
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    ...timestamps(),
  },
  session: {
    id: "test-session-id",
    userId: TEST_USER_ID,
    token: "test-token",
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    ...timestamps(),
  },
}

const caller = executionsRouter.createCaller({ auth: testAuth })
const unauthenticatedCaller = executionsRouter.createCaller({ auth: null })

const expectTRPCError =
  (code: TRPCError["code"], message?: string) =>
  (err: unknown): boolean => {
    assert(err instanceof TRPCError)
    assert.strictEqual(err.code, code)
    if (message !== undefined) assert.strictEqual(err.message, message)
    return true
  }

// ---------------------------------------------------------------------------
// Test Suites
// ---------------------------------------------------------------------------

describe("executionsRouter.getOne", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    await assert.rejects(
      unauthenticatedCaller.getOne({ id: "exec-1" }),
      expectTRPCError("UNAUTHORIZED")
    )
  })

  it("rejects non-string id with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error Testing invalid runtime input
      caller.getOne({ id: 123 }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects missing id with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error Testing invalid runtime input
      caller.getOne({}),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("throws NOT_FOUND when execution does not exist", async (t) => {
    t.mock.method(db.orm.public.Execution, "where", () => ({
      include() {
        return this
      },
      first: async () => null,
    }))

    await assert.rejects(
      caller.getOne({ id: "non-existent" }),
      expectTRPCError("NOT_FOUND", "Execution not found")
    )
  })

  it("throws NOT_FOUND when execution belongs to another user's workflow", async (t) => {
    t.mock.method(db.orm.public.Execution, "where", () => ({
      include() {
        return this
      },
      first: async () => ({
        id: "exec-1",
        workflowId: "wf-1",
        status: "SUCCESS",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        inngestEventId: "evt-1",
        workflow: {
          id: "wf-1",
          name: "Other User's Workflow",
          userId: OTHER_USER_ID,
        },
      }),
    }))

    await assert.rejects(
      caller.getOne({ id: "exec-1" }),
      expectTRPCError("NOT_FOUND", "Execution not found")
    )
  })

  it("returns execution with workflow when found and owned by caller", async (t) => {
    const mockExecution = {
      id: "exec-1",
      workflowId: "wf-1",
      status: "SUCCESS",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      inngestEventId: "evt-1",
      workflow: {
        id: "wf-1",
        name: "My Workflow",
        userId: TEST_USER_ID,
      },
    }

    t.mock.method(db.orm.public.Execution, "where", () => ({
      include() {
        return this
      },
      first: async () => mockExecution,
    }))

    const result = await caller.getOne({ id: "exec-1" })
    assert.deepStrictEqual(result, mockExecution)
  })
})

describe("executionsRouter.getMany input boundary validation", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    await assert.rejects(
      unauthenticatedCaller.getMany({
        page: PAGINATION.DEFAULT_PAGE,
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      }),
      expectTRPCError("UNAUTHORIZED")
    )
  })

  it("rejects page value 0 with BAD_REQUEST", async () => {
    await assert.rejects(
      caller.getMany({ page: 0, pageSize: PAGINATION.DEFAULT_PAGE_SIZE }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects page value -1 with BAD_REQUEST", async () => {
    await assert.rejects(
      caller.getMany({ page: -1, pageSize: PAGINATION.DEFAULT_PAGE_SIZE }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects non-integer page value 1.5 with BAD_REQUEST", async () => {
    await assert.rejects(
      caller.getMany({ page: 1.5, pageSize: PAGINATION.DEFAULT_PAGE_SIZE }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects pageSize value 0 (< MIN_PAGE_SIZE) with BAD_REQUEST", async () => {
    await assert.rejects(
      caller.getMany({ page: 1, pageSize: 0 }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects pageSize value 101 (> MAX_PAGE_SIZE) with BAD_REQUEST", async () => {
    await assert.rejects(
      caller.getMany({ page: 1, pageSize: 101 }),
      expectTRPCError("BAD_REQUEST")
    )
  })
})

describe("executionsRouter.getMany query execution and pagination", () => {
  it("returns empty result when user has no workflows", async (t) => {
    t.mock.method(db.orm.public.Workflow, "where", () => ({
      select() {
        return this
      },
      all: async () => [],
    }))

    const result = await caller.getMany({ page: 1, pageSize: 5 })
    assert.strictEqual(result.items.length, 0)
    assert.strictEqual(result.totalCount, 0)
    assert.strictEqual(result.totalPages, 0)
    assert.strictEqual(result.hasNextPage, false)
    assert.strictEqual(result.hasPreviousPage, false)
  })

  it("queries and returns paginated executions when user has workflows", async (t) => {
    t.mock.method(db.orm.public.Workflow, "where", () => ({
      select() {
        return this
      },
      all: async () => [{ id: "wf-1" }, { id: "wf-2" }],
    }))

    const mockExecutions = [
      {
        id: "exec-1",
        workflowId: "wf-1",
        status: "SUCCESS",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        inngestEventId: "evt-1",
        output: null,
        error: null,
        errorStack: null,
        workflow: { id: "wf-1", name: "Workflow 1" },
      },
    ]

    const queryMock = {
      include() {
        return this
      },
      orderBy() {
        return this
      },
      offset() {
        return this
      },
      limit() {
        return this
      },
      all: async () => mockExecutions,
      aggregate: async () => ({ count: 12 }),
    }

    t.mock.method(db.orm.public.Execution, "where", () => queryMock)

    const result = await caller.getMany({ page: 2, pageSize: 5 })
    assert.strictEqual(result.page, 2)
    assert.strictEqual(result.pageSize, 5)
    assert.strictEqual(result.totalCount, 12)
    assert.strictEqual(result.totalPages, 3)
    assert.strictEqual(result.hasNextPage, true)
    assert.strictEqual(result.hasPreviousPage, true)
    assert.strictEqual(result.items.length, 1)
  })
})
