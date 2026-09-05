/**
 * @file Unit tests for `workflowsRouter`.
 *
 * External collaborators (Polar billing client and the database ORM) are
 * replaced with `node:test` mocks so that every procedure can be exercised
 * in isolation. All mocks are created through the per-test `TestContext`
 * (`t.mock`) and are therefore restored automatically when each test ends.
 */

import { TRPCError } from "@trpc/server"
import assert from "node:assert"
import { describe, it, type TestContext } from "node:test"

import { NodeType } from "@/config/constants"
import { polarClient } from "@/lib/polar"
import { db } from "@/prisma/db"

import { workflowsRouter } from "./routers"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Identifier of the user every authenticated call is made on behalf of. */
const TEST_USER_ID = "test-user-id"

/** Error message emitted by the router when a workflow cannot be located. */
const WORKFLOW_NOT_FOUND_MESSAGE = "Workflow not found"

/** Resolved return type of `polarClient.customers.getStateExternal`. */
type CustomerState = Awaited<
  ReturnType<typeof polarClient.customers.getStateExternal>
>

/** Produces fresh `createdAt`/`updatedAt` ISO timestamps. */
const timestamps = () => ({
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

/** Authenticated context used for the "happy path" caller. */
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

/** Caller with a valid authenticated session. */
const caller = workflowsRouter.createCaller({ auth: testAuth })

/** Caller with no session – used to verify authorization guards. */
const unauthenticatedCaller = workflowsRouter.createCaller({ auth: null })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a validator for `assert.rejects` that asserts the rejection reason
 * is a `TRPCError` with the given `code` and, when supplied, `message`.
 */
const expectTRPCError =
  (code: TRPCError["code"], message?: string) =>
  (err: unknown): boolean => {
    assert(err instanceof TRPCError)
    assert.strictEqual(err.code, code)
    if (message !== undefined) assert.strictEqual(err.message, message)
    return true
  }

/**
 * Stubs `polarClient.customers.getStateExternal` so the router observes the
 * provided list of active subscriptions.
 */
const mockCustomerState = (t: TestContext, activeSubscriptions: unknown[]) =>
  t.mock.method(
    polarClient.customers,
    "getStateExternal",
    async () => ({ activeSubscriptions }) as unknown as CustomerState
  )

/**
 * Stubs `db.orm.public.Workflow.where` to return the supplied query object.
 * The returned mock exposes the captured predicate via `mock.calls`.
 */
const mockWorkflowWhere = <Query extends object>(
  t: TestContext,
  query: Query
) => t.mock.method(db.orm.public.Workflow, "where", () => query)

/**
 * Builds a chainable query stub where `include()` is a no-op returning the
 * chain itself and `first()` resolves to `result`.
 */
const includeFirstChain = <Result>(result: Result) => ({
  include() {
    return this
  },
  first: async () => result,
})

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe("workflowsRouter.create", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    await assert.rejects(
      unauthenticatedCaller.create(),
      expectTRPCError("UNAUTHORIZED")
    )
  })

  it("rejects caller without active subscription with FORBIDDEN", async (t) => {
    mockCustomerState(t, [])

    await assert.rejects(
      caller.create(),
      expectTRPCError("FORBIDDEN", "Active subscription required")
    )
  })

  it("creates workflow with initial node when active subscription is present", async (t) => {
    mockCustomerState(t, [{ id: "sub_123" }])

    const createWorkflow = t.mock.fn(async (data: Record<string, unknown>) => ({
      id: "wf-new-id",
      ...data,
      ...timestamps(),
    }))
    const createNode = t.mock.fn(async (data: Record<string, unknown>) => ({
      id: "node-new-id",
      ...data,
      ...timestamps(),
    }))

    const fakeTx = {
      orm: {
        public: {
          Workflow: { create: createWorkflow },
          Node: { create: createNode },
        },
      },
    }

    t.mock.method(
      db,
      "transaction",
      async (cb: (tx: typeof fakeTx) => Promise<unknown>) => cb(fakeTx)
    )

    const result = await caller.create()

    assert.strictEqual(result.id, "wf-new-id")
    assert.strictEqual(result.userId, TEST_USER_ID)
    assert(typeof result.name === "string" && result.name.length > 0)

    assert.deepStrictEqual(createWorkflow.mock.calls[0]?.arguments[0], {
      name: result.name,
      userId: TEST_USER_ID,
    })

    assert.deepStrictEqual(createNode.mock.calls[0]?.arguments[0], {
      workflowId: "wf-new-id",
      name: NodeType.INITIAL,
      type: NodeType.INITIAL,
      position: { x: 0, y: 0 },
    })
  })
})

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------

describe("workflowsRouter.remove", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    await assert.rejects(
      unauthenticatedCaller.remove({ id: "test-id" }),
      expectTRPCError("UNAUTHORIZED")
    )
  })

  it("rejects non-string id with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.remove({ id: 123 }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects missing id with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.remove({}),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("throws NOT_FOUND when workflow does not exist or does not belong to user", async (t) => {
    mockWorkflowWhere(t, { delete: async () => null })

    await assert.rejects(
      caller.remove({ id: "missing-id" }),
      expectTRPCError("NOT_FOUND", WORKFLOW_NOT_FOUND_MESSAGE)
    )
  })

  it("deletes and returns the workflow when found", async (t) => {
    const deletedWorkflow = {
      id: "wf-to-delete",
      name: "Deleted Workflow",
      userId: TEST_USER_ID,
      ...timestamps(),
    }

    const whereMock = mockWorkflowWhere(t, {
      delete: async () => deletedWorkflow,
    })

    const result = await caller.remove({ id: "wf-to-delete" })

    assert.deepStrictEqual(result, deletedWorkflow)
    assert.deepStrictEqual(whereMock.mock.calls[0]?.arguments[0], {
      id: "wf-to-delete",
      userId: TEST_USER_ID,
    })
  })
})

// ---------------------------------------------------------------------------
// updateName
// ---------------------------------------------------------------------------

describe("workflowsRouter.updateName", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    await assert.rejects(
      unauthenticatedCaller.updateName({ id: "test-id", name: "New Name" }),
      expectTRPCError("UNAUTHORIZED")
    )
  })

  it("rejects empty name string with BAD_REQUEST", async () => {
    await assert.rejects(
      caller.updateName({ id: "test-id", name: "" }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects missing name with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.updateName({ id: "test-id" }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects non-string name with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.updateName({ id: "test-id", name: 123 }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects missing id with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.updateName({ name: "New Name" }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects non-string id with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.updateName({ id: 123, name: "New Name" }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("throws NOT_FOUND when workflow does not exist or does not belong to user", async (t) => {
    mockWorkflowWhere(t, { update: async () => null })

    await assert.rejects(
      caller.updateName({ id: "missing-id", name: "New Name" }),
      expectTRPCError("NOT_FOUND", WORKFLOW_NOT_FOUND_MESSAGE)
    )
  })

  it("updates and returns the workflow when found", async (t) => {
    const updatedWorkflow = {
      id: "wf-1",
      name: "Renamed Workflow",
      userId: TEST_USER_ID,
      ...timestamps(),
    }

    const update = t.mock.fn(async (data: Record<string, unknown>) => {
      void data
      return updatedWorkflow
    })
    const whereMock = mockWorkflowWhere(t, { update })

    const result = await caller.updateName({
      id: "wf-1",
      name: "Renamed Workflow",
    })

    assert.deepStrictEqual(result, updatedWorkflow)
    assert.deepStrictEqual(whereMock.mock.calls[0]?.arguments[0], {
      id: "wf-1",
      userId: TEST_USER_ID,
    })
    assert.deepStrictEqual(update.mock.calls[0]?.arguments[0], {
      name: "Renamed Workflow",
    })
  })
})

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe("workflowsRouter.update", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    await assert.rejects(
      unauthenticatedCaller.update({ id: "test-id", nodes: [], edges: [] }),
      expectTRPCError("UNAUTHORIZED")
    )
  })

  it("rejects missing id with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.update({ nodes: [], edges: [] }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects non-string id with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.update({ id: 123, nodes: [], edges: [] }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects invalid nodes input with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.update({ id: "test-id", nodes: "invalid", edges: [] }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects invalid edges input with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.update({ id: "test-id", nodes: [], edges: "invalid" }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("throws NOT_FOUND when workflow does not exist or does not belong to user", async (t) => {
    mockWorkflowWhere(t, { first: async () => null })

    await assert.rejects(
      caller.update({ id: "missing-id", nodes: [], edges: [] }),
      expectTRPCError("NOT_FOUND", WORKFLOW_NOT_FOUND_MESSAGE)
    )
  })

  it("deletes old nodes, creates new nodes and connections, touches updatedAt and returns workflow", async (t) => {
    const existingWorkflow = {
      id: "wf-1",
      name: "Existing Workflow",
      userId: TEST_USER_ID,
      ...timestamps(),
    }

    mockWorkflowWhere(t, { first: async () => existingWorkflow })

    const deleteNodesMock = t.mock.fn(async () => [])
    const createNodesMock = t.mock.fn(async (data: unknown[]) => data)
    const createConnectionsMock = t.mock.fn(async (data: unknown[]) => data)
    const updateWorkflowMock = t.mock.fn(
      async (data: Record<string, unknown>) => ({
        ...existingWorkflow,
        ...data,
      })
    )

    const fakeTx = {
      orm: {
        public: {
          Node: {
            where: t.mock.fn((filter: Record<string, unknown>) => {
              void filter
              return { deleteAll: deleteNodesMock }
            }),
            createAll: createNodesMock,
          },
          Connection: {
            createAll: createConnectionsMock,
          },
          Workflow: {
            where: t.mock.fn((filter: Record<string, unknown>) => {
              void filter
              return { update: updateWorkflowMock }
            }),
          },
        },
      },
    }

    t.mock.method(
      db,
      "transaction",
      async (cb: (tx: typeof fakeTx) => Promise<unknown>) => cb(fakeTx)
    )

    const nodesInput = [
      {
        id: "node-1",
        type: "INITIAL",
        position: { x: 10, y: 20 },
        data: { label: "Start" },
      },
      {
        id: "node-2",
        type: null,
        position: { x: 30, y: 40 },
      },
    ]

    const edgesInput = [
      {
        source: "node-1",
        target: "node-2",
        sourceHandle: "source-h",
        targetHandle: "target-h",
      },
      {
        source: "node-1",
        target: "node-2",
      },
    ]

    const result = await caller.update({
      id: "wf-1",
      nodes: nodesInput,
      edges: edgesInput,
    })

    assert.deepStrictEqual(result, existingWorkflow)

    // Verify node deletion
    assert.strictEqual(deleteNodesMock.mock.calls.length, 1)

    // Verify nodes created
    assert.strictEqual(createNodesMock.mock.calls.length, 1)
    assert.deepStrictEqual(createNodesMock.mock.calls[0]?.arguments[0], [
      {
        id: "node-1",
        workflowId: "wf-1",
        name: "INITIAL",
        type: NodeType.INITIAL,
        position: { x: 10, y: 20 },
        data: { label: "Start" },
      },
      {
        id: "node-2",
        workflowId: "wf-1",
        name: "unknown",
        type: NodeType.INITIAL,
        position: { x: 30, y: 40 },
        data: {},
      },
    ])

    // Verify connections created
    assert.strictEqual(createConnectionsMock.mock.calls.length, 1)
    assert.deepStrictEqual(createConnectionsMock.mock.calls[0]?.arguments[0], [
      {
        workflowId: "wf-1",
        fromNodeId: "node-1",
        toNodeId: "node-2",
        fromOutput: "source-h",
        toInput: "target-h",
      },
      {
        workflowId: "wf-1",
        fromNodeId: "node-1",
        toNodeId: "node-2",
        fromOutput: "main",
        toInput: "main",
      },
    ])

    // Verify workflow updatedAt update
    assert.strictEqual(updateWorkflowMock.mock.calls.length, 1)
    const updateArg = updateWorkflowMock.mock.calls[0]?.arguments[0] as {
      updatedAt?: string
    }
    assert(typeof updateArg?.updatedAt === "string")
  })
})

// ---------------------------------------------------------------------------
// getOne
// ---------------------------------------------------------------------------

describe("workflowsRouter.getOne", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    await assert.rejects(
      unauthenticatedCaller.getOne({ id: "test-id" }),
      expectTRPCError("UNAUTHORIZED")
    )
  })

  it("rejects non-string id with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.getOne({ id: 123 }),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("rejects missing id with BAD_REQUEST", async () => {
    await assert.rejects(
      // @ts-expect-error testing invalid input type
      caller.getOne({}),
      expectTRPCError("BAD_REQUEST")
    )
  })

  it("throws NOT_FOUND when workflow does not exist or does not belong to user", async (t) => {
    mockWorkflowWhere(t, includeFirstChain(null))

    await assert.rejects(
      caller.getOne({ id: "missing-id" }),
      expectTRPCError("NOT_FOUND", WORKFLOW_NOT_FOUND_MESSAGE)
    )
  })

  it("transforms and returns react-flow compatible nodes and edges", async (t) => {
    const mockWorkflowData = {
      id: "wf-1",
      name: "My Workflow",
      userId: TEST_USER_ID,
      nodes: [
        {
          id: "node-1",
          type: "INITIAL",
          position: { x: 100, y: 200 },
          data: { label: "Start" },
        },
        {
          id: "node-2",
          type: "HTTP_REQUEST",
          position: { x: 300, y: 400 },
          data: null,
        },
      ],
      connections: [
        {
          id: "conn-1",
          fromNodeId: "node-1",
          toNodeId: "node-2",
          fromOutput: "main",
          toInput: "main",
        },
      ],
    }

    mockWorkflowWhere(t, includeFirstChain(mockWorkflowData))

    const result = await caller.getOne({ id: "wf-1" })

    assert.strictEqual(result.id, "wf-1")
    assert.strictEqual(result.name, "My Workflow")

    // `null` node data must be normalized to an empty object.
    assert.deepStrictEqual(result.nodes, [
      {
        id: "node-1",
        type: "INITIAL",
        position: { x: 100, y: 200 },
        data: { label: "Start" },
      },
      {
        id: "node-2",
        type: "HTTP_REQUEST",
        position: { x: 300, y: 400 },
        data: {},
      },
    ])

    // Connections are mapped onto react-flow's edge shape.
    assert.deepStrictEqual(result.edges, [
      {
        id: "conn-1",
        source: "node-1",
        target: "node-2",
        sourceHandle: "main",
        targetHandle: "main",
      },
    ])
  })
})

// ---------------------------------------------------------------------------
// getMany
// ---------------------------------------------------------------------------

describe("workflowsRouter.getMany input boundary validation", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    await assert.rejects(
      unauthenticatedCaller.getMany({}),
      expectTRPCError("UNAUTHORIZED")
    )
  })

  /** Pagination inputs that must be rejected by the input schema. */
  const invalidPaginationInputs: ReadonlyArray<
    [label: string, input: Parameters<typeof caller.getMany>[0]]
  > = [
    ["page value 0", { page: 0 }],
    ["page value -1", { page: -1 }],
    ["non-integer page value 1.5", { page: 1.5 }],
    ["non-integer pageSize value 1.5", { pageSize: 1.5 }],
  ]

  for (const [label, input] of invalidPaginationInputs) {
    it(`rejects ${label} with BAD_REQUEST`, async () => {
      await assert.rejects(
        caller.getMany(input),
        expectTRPCError("BAD_REQUEST")
      )
    })
  }
})
