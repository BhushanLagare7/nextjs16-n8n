import assert from "node:assert"
import { describe, it } from "node:test"

import { CredentialType } from "@/config/constants"
import { decrypt } from "@/lib/encryption"
import { polarClient } from "@/lib/polar"
import { db } from "@/prisma/db"

import { credentialsRouter } from "./routers"

const TEST_USER_ID = "test-user-id"

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

const caller = credentialsRouter.createCaller({ auth: testAuth })

function mockActiveSubscription(t: {
  mock: { method: typeof import("node:test").mock.method }
}) {
  return t.mock.method(
    polarClient.customers,
    "getStateExternal",
    async () =>
      ({
        activeSubscriptions: [{ id: "sub-1", status: "active" }],
      }) as unknown as Awaited<
        ReturnType<typeof polarClient.customers.getStateExternal>
      >
  )
}

describe("credentialsRouter - encryption", () => {
  it("encrypts credential value on create", async (t) => {
    mockActiveSubscription(t)

    type CreateData = {
      name: string
      userId: string
      type: CredentialType
      value: string
    }

    let createdData: CreateData | null = null

    t.mock.method(db.orm.public.Credential, "create", async (data: unknown) => {
      createdData = data as CreateData
      return {
        id: "cred-1",
        ...(data as Record<string, unknown>),
        ...timestamps(),
      }
    })

    const rawApiKey = "sk-proj-test-plain-text-api-key-123"
    await caller.create({
      name: "My OpenAI Key",
      type: CredentialType.OPENAI,
      value: rawApiKey,
    })

    assert.ok(createdData)
    const savedData = createdData as CreateData
    // Value in database must NOT be the plain text API key
    assert.notStrictEqual(savedData.value, rawApiKey)
    // Decrypting the database value must recover the original API key
    assert.strictEqual(decrypt(savedData.value), rawApiKey)
  })

  it("encrypts credential value on update", async (t) => {
    type UpdateData = {
      name: string
      type: CredentialType
      value: string
    }

    let updatePayload: UpdateData | null = null

    t.mock.method(db.orm.public.Credential, "where", () => ({
      update: async (data: unknown) => {
        updatePayload = data as UpdateData
        return {
          id: "cred-1",
          userId: TEST_USER_ID,
          ...(data as Record<string, unknown>),
          ...timestamps(),
        }
      },
    }))

    const newRawApiKey = "sk-ant-test-plain-text-anthropic-key-456"
    await caller.update({
      id: "cred-1",
      name: "Updated Anthropic Key",
      type: CredentialType.ANTHROPIC,
      value: newRawApiKey,
    })

    assert.ok(updatePayload)
    const savedPayload = updatePayload as UpdateData
    // Value in database must NOT be the plain text API key
    assert.notStrictEqual(savedPayload.value, newRawApiKey)
    // Decrypting the database value must recover the original API key
    assert.strictEqual(decrypt(savedPayload.value), newRawApiKey)
  })
})
