import { TRPCError } from "@trpc/server"
import assert from "node:assert"
import { describe, it } from "node:test"

import { workflowsRouter } from "./routers"

describe("workflowsRouter.getMany input boundary validation", () => {
  const caller = workflowsRouter.createCaller({
    auth: {
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: {
        id: "test-session-id",
        userId: "test-user-id",
        token: "test-token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  })

  it("rejects page value 0 with BAD_REQUEST", async () => {
    await assert.rejects(caller.getMany({ page: 0 }), (err: unknown) => {
      assert(err instanceof TRPCError)
      assert.strictEqual(err.code, "BAD_REQUEST")
      return true
    })
  })

  it("rejects page value -1 with BAD_REQUEST", async () => {
    await assert.rejects(caller.getMany({ page: -1 }), (err: unknown) => {
      assert(err instanceof TRPCError)
      assert.strictEqual(err.code, "BAD_REQUEST")
      return true
    })
  })

  it("rejects non-integer page value 1.5 with BAD_REQUEST", async () => {
    await assert.rejects(caller.getMany({ page: 1.5 }), (err: unknown) => {
      assert(err instanceof TRPCError)
      assert.strictEqual(err.code, "BAD_REQUEST")
      return true
    })
  })

  it("rejects non-integer pageSize value 1.5 with BAD_REQUEST", async () => {
    await assert.rejects(caller.getMany({ pageSize: 1.5 }), (err: unknown) => {
      assert(err instanceof TRPCError)
      assert.strictEqual(err.code, "BAD_REQUEST")
      return true
    })
  })
})
