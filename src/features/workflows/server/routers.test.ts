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
import { inngest } from "@/inngest/client"
import { polarClient } from "@/lib/polar"
import { db } from "@/prisma/db"

import { workflowsRouter } from "./routers"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Identifier of the user every authenticated call is made on behalf of.
 */
const TEST_USER_ID = "test-user-id"

/**
 * Error message emitted by the router when a workflow cannot be located.
 */
const WORKFLOW_NOT_FOUND_MESSAGE = "Workflow not found"

/**
 * Resolved return type of `polarClient.customers.getStateExternal`.
 */
type CustomerState = Awaited<
  ReturnType<typeof polarClient.customers.getStateExternal>
>

/**
 * Produces fresh ISO timestamps for entity creation and updates.
 *
 * @returns An object containing `createdAt` and `updatedAt` ISO strings.
 */
const timestamps = () => ({
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

/**
 * Authenticated context fixture used for the "happy path" caller.
 */
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

/**
 * Base workflow fixture to ensure consistent entity shape across tests.
 */
const baseWorkflowFixture = (id: string, name: string) => ({
  id,
  name,
  userId: TEST_USER_ID,
})

/**
 * Common invalid single-id inputs for procedures expecting `{ id: string }`.
 */
const invalidIdInputs: ReadonlyArray<[label: string, input: unknown]> = [
  ["non-string id", { id: 123 }],
  ["missing id", {}],
]

/** Caller configured with a valid authenticated session. */
const caller = workflowsRouter.createCaller({ auth: testAuth })

/** Caller configured with no session to verify authorization guards. */
const unauthenticatedCaller = workflowsRouter.createCaller({ auth: null })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a validator for `assert.rejects` that asserts the rejection reason
 * is a `TRPCError` with the given `code` and optional `message`.
 *
 * @param code - The expected TRPC error code (e.g., "UNAUTHORIZED").
 * @param message - The expected TRPC error message (optional).
 * @returns A predicate function for `assert.rejects`.
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
 *
 * @param t - The active test context.
 * @param activeSubscriptions - Array of mock subscriptions to return.
 * @returns The mock method instance.
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
 *
 * @param t - The active test context.
 * @param query - The mock query chain to return from `.where()`.
 * @returns The mock method instance.
 */
const mockWorkflowWhere = <Query extends object>(
  t: TestContext,
  query: Query
) => t.mock.method(db.orm.public.Workflow, "where", () => query)

/**
 * Builds a chainable query stub where `include()` is a no-op returning the
 * chain itself and `first()` resolves to `result`.
 *
 * @param result - The data to resolve when `.first()` is invoked.
 * @returns A mock query chain object.
 */
const includeFirstChain = <Result>(result: Result) => ({
  include() {
    return this
  },
  first: async () => result,
})

/** Options to configure the chainable query stub for `getMany`. */
interface MockGetManyOptions<Item> {
  items: Item[]
  totalCount: number
}

/**
 * Builds a chainable query stub for `getMany` operations supporting `.where()`,
 * `.orderBy()`, `.offset()`, `.limit()`, `.all()`, and `.aggregate()`.
 *
 * @param options - Configuration containing items and totalCount to return.
 * @returns An object containing the query chain and captured execution state.
 */
const createGetManyQueryMock = <Item>(options: MockGetManyOptions<Item>) => {
  const chainedWherePredicates: Array<(w: unknown) => unknown> = []
  let capturedOrderByFns: Array<(w: unknown) => unknown> | null = null
  let capturedOffset: number | null = null
  let capturedLimit: number | null = null

  const queryChain = {
    where(predicate: (w: unknown) => unknown) {
      chainedWherePredicates.push(predicate)
      return queryChain
    },
    orderBy(fn: ((w: unknown) => unknown) | Array<(w: unknown) => unknown>) {
      capturedOrderByFns = Array.isArray(fn) ? fn : [fn]
      return {
        offset(offsetVal: number) {
          capturedOffset = offsetVal
          return {
            limit(limitVal: number) {
              capturedLimit = limitVal
              return {
                all: async () => options.items,
              }
            },
          }
        },
      }
    },
    aggregate: async () => ({ count: options.totalCount }),
  }

  return {
    queryChain,
    chainedWherePredicates,
    getCapturedOrderByFns: () => capturedOrderByFns,
    getCapturedOffset: () => capturedOffset,
    getCapturedLimit: () => capturedLimit,
    getChainedWherePredicates: () => chainedWherePredicates,
  }
}

/**
 * Stubs the database transaction manager to immediately execute the callback
 * with the provided fake transaction context.
 *
 * @param t - The active test context.
 * @param fakeTx - The simulated transaction object to inject.
 */
const mockDbTransaction = <T>(t: TestContext, fakeTx: T) => {
  t.mock.method(db, "transaction", async (cb: (tx: T) => Promise<unknown>) =>
    cb(fakeTx)
  )
}

/**
 * Creates a mock transaction object and spies for workflow update operations.
 *
 * @param t - The active test context.
 * @param existingWorkflow - The baseline workflow being updated.
 * @returns An object containing the fake transaction and individual mutation spies.
 */
const createUpdateTxMock = (
  t: TestContext,
  existingWorkflow: ReturnType<typeof baseWorkflowFixture>
) => {
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
          where: t.mock.fn(() => ({ deleteAll: deleteNodesMock })),
          createAll: createNodesMock,
        },
        Connection: {
          createAll: createConnectionsMock,
        },
        Workflow: {
          where: t.mock.fn(() => ({ update: updateWorkflowMock })),
        },
      },
    },
  }

  return {
    fakeTx,
    deleteNodesMock,
    createNodesMock,
    createConnectionsMock,
    updateWorkflowMock,
  }
}

// ---------------------------------------------------------------------------
// execute
// ---------------------------------------------------------------------------

describe("workflowsRouter.execute", () => {
  it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
    await assert.rejects(
      unauthenticatedCaller.execute({ id: "test-id" }),
      expectTRPCError("UNAUTHORIZED")
    )
  })

  for (const [label, input] of invalidIdInputs) {
    it(`rejects ${label} with BAD_REQUEST`, async () => {
      await assert.rejects(
        caller.execute(input as Parameters<typeof caller.execute>[0]),
        expectTRPCError("BAD_REQUEST")
      )
    })
  }

  it("throws NOT_FOUND when workflow does not exist or does not belong to user", async (t) => {
    mockWorkflowWhere(t, { first: async () => null })

    await assert.rejects(
      caller.execute({ id: "missing-id" }),
      expectTRPCError("NOT_FOUND", WORKFLOW_NOT_FOUND_MESSAGE)
    )
  })

  it("executes workflow, sends inngest event, and returns workflow when found", async (t) => {
    const existingWorkflow = baseWorkflowFixture("wf-1", "Test Workflow")

    const whereMock = mockWorkflowWhere(t, {
      first: async () => existingWorkflow,
    })
    const inngestSendMock = t.mock.method(inngest, "send", async () => ({
      ids: ["evt_123"],
    }))

    const result = await caller.execute({ id: "wf-1" })

    assert.deepStrictEqual(result, existingWorkflow)
    assert.deepStrictEqual(whereMock.mock.calls[0]?.arguments[0], {
      id: "wf-1",
      userId: TEST_USER_ID,
    })
    assert.strictEqual(inngestSendMock.mock.calls.length, 1)
    const callArg = inngestSendMock.mock.calls[0]?.arguments[0] as {
      name: string
      data: unknown
      id: string
    }
    assert.strictEqual(callArg.name, "workflows/execute.workflow")
    assert.deepStrictEqual(callArg.data, {
      workflowId: "wf-1",
      userId: TEST_USER_ID,
    })
    assert.strictEqual(typeof callArg.id, "string")
  })
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

    mockDbTransaction(t, fakeTx)

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

  for (const [label, input] of invalidIdInputs) {
    it(`rejects ${label} with BAD_REQUEST`, async () => {
      await assert.rejects(
        caller.remove(input as Parameters<typeof caller.remove>[0]),
        expectTRPCError("BAD_REQUEST")
      )
    })
  }

  it("throws NOT_FOUND when workflow does not exist or does not belong to user", async (t) => {
    mockWorkflowWhere(t, { delete: async () => null })

    await assert.rejects(
      caller.remove({ id: "missing-id" }),
      expectTRPCError("NOT_FOUND", WORKFLOW_NOT_FOUND_MESSAGE)
    )
  })

  it("deletes and returns the workflow when found", async (t) => {
    const deletedWorkflow = baseWorkflowFixture(
      "wf-to-delete",
      "Deleted Workflow"
    )

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

  const invalidUpdateNameInputs: ReadonlyArray<
    [label: string, input: unknown]
  > = [
    ["empty name string", { id: "test-id", name: "" }],
    ["missing name", { id: "test-id" }],
    ["non-string name", { id: "test-id", name: 123 }],
    ["missing id", { name: "New Name" }],
    ["non-string id", { id: 123, name: "New Name" }],
  ]

  for (const [label, input] of invalidUpdateNameInputs) {
    it(`rejects ${label} with BAD_REQUEST`, async () => {
      await assert.rejects(
        caller.updateName(input as Parameters<typeof caller.updateName>[0]),
        expectTRPCError("BAD_REQUEST")
      )
    })
  }

  it("throws NOT_FOUND when workflow does not exist or does not belong to user", async (t) => {
    mockWorkflowWhere(t, { update: async () => null })

    await assert.rejects(
      caller.updateName({ id: "missing-id", name: "New Name" }),
      expectTRPCError("NOT_FOUND", WORKFLOW_NOT_FOUND_MESSAGE)
    )
  })

  it("updates and returns the workflow when found", async (t) => {
    const updatedWorkflow = baseWorkflowFixture("wf-1", "Renamed Workflow")

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

  const invalidUpdateInputs: ReadonlyArray<[label: string, input: unknown]> = [
    ["missing id", { nodes: [], edges: [] }],
    ["non-string id", { id: 123, nodes: [], edges: [] }],
    ["invalid nodes input", { id: "test-id", nodes: "invalid", edges: [] }],
    ["invalid edges input", { id: "test-id", nodes: [], edges: "invalid" }],
    [
      "node with invalid NodeType enum value",
      {
        id: "wf-1",
        nodes: [
          {
            id: "node-1",
            type: "INVALID_NODE_TYPE",
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
      },
    ],
    [
      "node with invalid position coordinates",
      {
        id: "wf-1",
        nodes: [
          {
            id: "node-1",
            type: NodeType.INITIAL,
            position: { x: "not-a-number", y: 0 },
          },
        ],
        edges: [],
      },
    ],
  ]

  for (const [label, input] of invalidUpdateInputs) {
    it(`rejects ${label} with BAD_REQUEST`, async () => {
      await assert.rejects(
        caller.update(input as Parameters<typeof caller.update>[0]),
        expectTRPCError("BAD_REQUEST")
      )
    })
  }

  it("throws NOT_FOUND when workflow does not exist or does not belong to user", async (t) => {
    mockWorkflowWhere(t, { first: async () => null })

    await assert.rejects(
      caller.update({ id: "missing-id", nodes: [], edges: [] }),
      expectTRPCError("NOT_FOUND", WORKFLOW_NOT_FOUND_MESSAGE)
    )
  })

  it("deletes old nodes, creates new nodes and connections, touches updatedAt and returns workflow", async (t) => {
    const existingWorkflow = baseWorkflowFixture("wf-1", "Existing Workflow")
    mockWorkflowWhere(t, { first: async () => existingWorkflow })

    const {
      fakeTx,
      deleteNodesMock,
      createNodesMock,
      createConnectionsMock,
      updateWorkflowMock,
    } = createUpdateTxMock(t, existingWorkflow)

    mockDbTransaction(t, fakeTx)

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
    assert.strictEqual(deleteNodesMock.mock.calls.length, 1)

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

    assert.strictEqual(updateWorkflowMock.mock.calls.length, 1)
    const updateArg = updateWorkflowMock.mock.calls[0]?.arguments[0] as {
      updatedAt?: string
    }
    assert(typeof updateArg?.updatedAt === "string")
  })

  it("rejects when edge references unknown source node with BAD_REQUEST", async (t) => {
    const existingWorkflow = baseWorkflowFixture("wf-1", "Existing Workflow")
    mockWorkflowWhere(t, { first: async () => existingWorkflow })

    mockDbTransaction(t, {})

    await assert.rejects(
      caller.update({
        id: "wf-1",
        nodes: [
          {
            id: "node-1",
            type: NodeType.INITIAL,
            position: { x: 0, y: 0 },
          },
        ],
        edges: [
          {
            source: "node-missing",
            target: "node-1",
          },
        ],
      }),
      expectTRPCError(
        "BAD_REQUEST",
        'Edge references unknown node: source="node-missing", target="node-1"'
      )
    )
  })

  it("rejects when edge references unknown target node with BAD_REQUEST", async (t) => {
    const existingWorkflow = baseWorkflowFixture("wf-1", "Existing Workflow")
    mockWorkflowWhere(t, { first: async () => existingWorkflow })

    mockDbTransaction(t, {})

    await assert.rejects(
      caller.update({
        id: "wf-1",
        nodes: [
          {
            id: "node-1",
            type: NodeType.INITIAL,
            position: { x: 0, y: 0 },
          },
        ],
        edges: [
          {
            source: "node-1",
            target: "node-missing",
          },
        ],
      }),
      expectTRPCError(
        "BAD_REQUEST",
        'Edge references unknown node: source="node-1", target="node-missing"'
      )
    )
  })

  it("handles empty nodes and edges arrays successfully", async (t) => {
    const existingWorkflow = baseWorkflowFixture("wf-1", "Existing Workflow")
    mockWorkflowWhere(t, { first: async () => existingWorkflow })

    const {
      fakeTx,
      deleteNodesMock,
      createNodesMock,
      createConnectionsMock,
      updateWorkflowMock,
    } = createUpdateTxMock(t, existingWorkflow)

    mockDbTransaction(t, fakeTx)

    const result = await caller.update({
      id: "wf-1",
      nodes: [],
      edges: [],
    })

    assert.deepStrictEqual(result, existingWorkflow)
    assert.strictEqual(deleteNodesMock.mock.calls.length, 1)
    assert.strictEqual(createNodesMock.mock.calls.length, 1)
    assert.deepStrictEqual(createNodesMock.mock.calls[0]?.arguments[0], [])
    assert.strictEqual(createConnectionsMock.mock.calls.length, 1)
    assert.deepStrictEqual(
      createConnectionsMock.mock.calls[0]?.arguments[0],
      []
    )
    assert.strictEqual(updateWorkflowMock.mock.calls.length, 1)
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

  for (const [label, input] of invalidIdInputs) {
    it(`rejects ${label} with BAD_REQUEST`, async () => {
      await assert.rejects(
        caller.getOne(input as Parameters<typeof caller.getOne>[0]),
        expectTRPCError("BAD_REQUEST")
      )
    })
  }

  it("throws NOT_FOUND when workflow does not exist or does not belong to user", async (t) => {
    mockWorkflowWhere(t, includeFirstChain(null))

    await assert.rejects(
      caller.getOne({ id: "missing-id" }),
      expectTRPCError("NOT_FOUND", WORKFLOW_NOT_FOUND_MESSAGE)
    )
  })

  it("transforms and returns react-flow compatible nodes and edges", async (t) => {
    const mockWorkflowData = {
      ...baseWorkflowFixture("wf-1", "My Workflow"),
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

  it("handles workflow with empty nodes and connections and verifies user scoping", async (t) => {
    const emptyWorkflow = {
      ...baseWorkflowFixture("wf-empty", "Empty Workflow"),
      nodes: [],
      connections: [],
    }

    const whereMock = mockWorkflowWhere(t, includeFirstChain(emptyWorkflow))

    const result = await caller.getOne({ id: "wf-empty" })

    assert.strictEqual(result.id, "wf-empty")
    assert.strictEqual(result.name, "Empty Workflow")
    assert.deepStrictEqual(result.nodes, [])
    assert.deepStrictEqual(result.edges, [])
    assert.deepStrictEqual(whereMock.mock.calls[0]?.arguments[0], {
      id: "wf-empty",
      userId: TEST_USER_ID,
    })
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
    [label: string, input: unknown]
  > = [
    ["page value 0", { page: 0 }],
    ["page value -1", { page: -1 }],
    ["non-integer page value 1.5", { page: 1.5 }],
    ["non-integer pageSize value 1.5", { pageSize: 1.5 }],
    ["pageSize value 0 (< MIN_PAGE_SIZE)", { pageSize: 0 }],
    ["pageSize value -1", { pageSize: -1 }],
    ["pageSize value 101 (> MAX_PAGE_SIZE)", { pageSize: 101 }],
    ["non-string search value", { search: 123 }],
    ["non-number page value", { page: "1" }],
    ["non-number pageSize value", { pageSize: "5" }],
  ]

  for (const [label, input] of invalidPaginationInputs) {
    it(`rejects ${label} with BAD_REQUEST`, async () => {
      await assert.rejects(
        caller.getMany(input as Parameters<typeof caller.getMany>[0]),
        expectTRPCError("BAD_REQUEST")
      )
    })
  }
})

// ---------------------------------------------------------------------------
// getMany query execution and pagination
// ---------------------------------------------------------------------------

describe("workflowsRouter.getMany query execution and pagination", () => {
  it("returns paginated workflows with default parameters and derives pagination metadata", async (t) => {
    const mockItems = [
      baseWorkflowFixture("wf-1", "Workflow 1"),
      baseWorkflowFixture("wf-2", "Workflow 2"),
    ]

    const {
      queryChain,
      getCapturedOrderByFns,
      getCapturedOffset,
      getCapturedLimit,
    } = createGetManyQueryMock({
      items: mockItems,
      totalCount: 12,
    })

    const whereMock = mockWorkflowWhere(t, queryChain)

    const result = await caller.getMany({})

    assert.deepStrictEqual(result.items, mockItems)
    assert.strictEqual(result.page, 1)
    assert.strictEqual(result.pageSize, 5)
    assert.strictEqual(result.totalCount, 12)
    assert.strictEqual(result.totalPages, 3)
    assert.strictEqual(result.hasNextPage, true)
    assert.strictEqual(result.hasPreviousPage, false)

    // Verify offset and limit for page 1 with default pageSize 5
    assert.strictEqual(getCapturedOffset(), 0)
    assert.strictEqual(getCapturedLimit(), 5)

    // Verify where callback scoped to current user id
    const initialPredicate = whereMock.mock.calls[0]?.arguments[0] as (w: {
      userId: { eq: (id: string) => unknown }
    }) => unknown
    const eqMock = t.mock.fn()
    initialPredicate({ userId: { eq: eqMock } })
    assert.strictEqual(eqMock.mock.calls.length, 1)
    assert.strictEqual(eqMock.mock.calls[0]?.arguments[0], TEST_USER_ID)

    // Verify orderBy clause sorts by updatedAt desc, then id desc
    const orderByFns = getCapturedOrderByFns() as Array<
      (w: {
        updatedAt: { desc: () => unknown }
        id: { desc: () => unknown }
      }) => unknown
    >
    assert.ok(orderByFns)
    assert.strictEqual(orderByFns.length, 2)
    const updatedAtDescMock = t.mock.fn()
    orderByFns[0]!({
      updatedAt: { desc: updatedAtDescMock },
      id: { desc: t.mock.fn() },
    })
    assert.strictEqual(updatedAtDescMock.mock.calls.length, 1)
    const idDescMock = t.mock.fn()
    orderByFns[1]!({
      updatedAt: { desc: t.mock.fn() },
      id: { desc: idDescMock },
    })
    assert.strictEqual(idDescMock.mock.calls.length, 1)
  })

  it("derives hasNextPage=false and hasPreviousPage=true on the last page", async (t) => {
    const mockItems = [
      baseWorkflowFixture("wf-11", "Workflow 11"),
      baseWorkflowFixture("wf-12", "Workflow 12"),
    ]

    const { queryChain, getCapturedOffset, getCapturedLimit } =
      createGetManyQueryMock({
        items: mockItems,
        totalCount: 12,
      })

    mockWorkflowWhere(t, queryChain)

    const result = await caller.getMany({ page: 3, pageSize: 5 })

    assert.strictEqual(result.page, 3)
    assert.strictEqual(result.pageSize, 5)
    assert.strictEqual(result.totalCount, 12)
    assert.strictEqual(result.totalPages, 3)
    assert.strictEqual(result.hasNextPage, false)
    assert.strictEqual(result.hasPreviousPage, true)
    assert.strictEqual(getCapturedOffset(), 10)
    assert.strictEqual(getCapturedLimit(), 5)
  })

  it("derives hasNextPage=true and hasPreviousPage=true on an intermediate page", async (t) => {
    const mockItems = [baseWorkflowFixture("wf-6", "Workflow 6")]

    const { queryChain, getCapturedOffset, getCapturedLimit } =
      createGetManyQueryMock({
        items: mockItems,
        totalCount: 12,
      })

    mockWorkflowWhere(t, queryChain)

    const result = await caller.getMany({ page: 2, pageSize: 5 })

    assert.strictEqual(result.page, 2)
    assert.strictEqual(result.pageSize, 5)
    assert.strictEqual(result.totalCount, 12)
    assert.strictEqual(result.totalPages, 3)
    assert.strictEqual(result.hasNextPage, true)
    assert.strictEqual(result.hasPreviousPage, true)
    assert.strictEqual(getCapturedOffset(), 5)
    assert.strictEqual(getCapturedLimit(), 5)
  })

  it("handles empty workflow list when totalCount is 0", async (t) => {
    const { queryChain } = createGetManyQueryMock({
      items: [],
      totalCount: 0,
    })

    mockWorkflowWhere(t, queryChain)

    const result = await caller.getMany({ page: 1, pageSize: 10 })

    assert.deepStrictEqual(result.items, [])
    assert.strictEqual(result.page, 1)
    assert.strictEqual(result.pageSize, 10)
    assert.strictEqual(result.totalCount, 0)
    assert.strictEqual(result.totalPages, 0)
    assert.strictEqual(result.hasNextPage, false)
    assert.strictEqual(result.hasPreviousPage, false)
  })

  it("applies search filter with ilike when search is provided", async (t) => {
    const mockItems = [baseWorkflowFixture("wf-search-1", "Invoice Processor")]

    const { queryChain, chainedWherePredicates } = createGetManyQueryMock({
      items: mockItems,
      totalCount: 1,
    })

    mockWorkflowWhere(t, queryChain)

    const result = await caller.getMany({ search: "invoice" })

    assert.deepStrictEqual(result.items, mockItems)
    assert.strictEqual(result.totalCount, 1)

    // Verify search filter was appended to the where chain
    assert.strictEqual(chainedWherePredicates.length, 1)
    const searchPredicate = chainedWherePredicates[0] as (w: {
      name: { ilike: (pattern: string) => unknown }
    }) => unknown
    const ilikeMock = t.mock.fn()
    searchPredicate({ name: { ilike: ilikeMock } })
    assert.strictEqual(ilikeMock.mock.calls.length, 1)
    assert.strictEqual(ilikeMock.mock.calls[0]?.arguments[0], "%invoice%")
  })
})
