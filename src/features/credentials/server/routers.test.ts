/**
 * Unit tests for `credentialsRouter`, focused on the encryption boundary
 * between the API layer and the database.
 *
 * These tests verify that:
 *  - Credential values are encrypted before being persisted (create & update).
 *  - Encrypted values can be decrypted back to their original plain text.
 *  - Sensitive credential values are never selected/returned by read
 *    operations such as `getOne`.
 *
 * External dependencies (`db`, `polarClient`) are mocked per-test using
 * `node:test`'s built-in mocking utilities so that no real database or
 * network calls are made.
 */

import assert from "node:assert"
import { describe, it, type TestContext } from "node:test"

import { CredentialType } from "@/config/constants"
import { decrypt } from "@/lib/encryption"
import { polarClient } from "@/lib/polar"
import { db } from "@/prisma/db"

import { credentialsRouter } from "./routers"

/** Static user id used to build the fake authenticated session below. */
const TEST_USER_ID = "test-user-id"

/** Fake credential id reused across tests that don't create a real record. */
const TEST_CREDENTIAL_ID = "cred-1"

/**
 * Builds a fresh pair of ISO timestamps for `createdAt`/`updatedAt` fields,
 * mimicking what the database would generate for a new/updated record.
 */
const timestamps = () => ({
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

/**
 * Minimal `auth` session object matching the shape expected by
 * `credentialsRouter.createCaller`, used to simulate an authenticated request.
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

/** Pre-authenticated caller used by every test in this suite. */
const caller = credentialsRouter.createCaller({ auth: testAuth })

/**
 * Mocks `polarClient.customers.getStateExternal` to report an active
 * subscription, allowing routes that gate on subscription status
 * (e.g. `create`) to proceed during tests.
 */
function mockActiveSubscription(t: TestContext) {
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

/**
 * Mocks `db.orm.public.Credential.where(...).update(...)`, capturing the
 * payload passed to `update` so tests can assert on it afterwards.
 *
 * @returns a getter that returns the captured update payload
 *          (`null` until `update` has been invoked).
 */
function mockCredentialUpdate<T>(t: TestContext) {
  let payload: T | null = null

  t.mock.method(db.orm.public.Credential, "where", () => ({
    update: async (data: unknown) => {
      payload = data as T
      return {
        id: TEST_CREDENTIAL_ID,
        userId: TEST_USER_ID,
        ...(data as Record<string, unknown>),
        ...timestamps(),
      }
    },
  }))

  return () => payload
}

/**
 * Mocks `db.orm.public.Credential.where(...).select(...).first()`, capturing
 * the field names passed to `select` and resolving `first()` with the given
 * fake record.
 *
 * @param record the fake record returned by `first()`
 * @returns a getter that returns the field names passed to `select`
 */
function mockCredentialSelect(t: TestContext, record: Record<string, unknown>) {
  let selectedFields: string[] = []

  t.mock.method(db.orm.public.Credential, "where", () => ({
    select: (...fields: string[]) => {
      selectedFields = fields
      return {
        first: async () => record,
      }
    },
  }))

  return () => selectedFields
}

describe("credentialsRouter - encryption", () => {
  it("encrypts credential value on create", async (t) => {
    mockActiveSubscription(t)

    type CredentialBaseData = {
      name: string
      type: CredentialType
      value: string
    }
    type CreateData = CredentialBaseData & { userId: string }

    let createdData: CreateData | null = null

    t.mock.method(db.orm.public.Credential, "create", async (data: unknown) => {
      createdData = data as CreateData
      return {
        id: TEST_CREDENTIAL_ID,
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

    const getUpdatePayload = mockCredentialUpdate<UpdateData>(t)

    const newRawApiKey = "sk-ant-test-plain-text-anthropic-key-456"
    await caller.update({
      id: TEST_CREDENTIAL_ID,
      name: "Updated Anthropic Key",
      type: CredentialType.ANTHROPIC,
      value: newRawApiKey,
    })

    const savedPayload = getUpdatePayload()
    assert.ok(savedPayload)
    // Value in database must NOT be the plain text API key
    assert.notStrictEqual(savedPayload.value, newRawApiKey)
    // Decrypting the database value must recover the original API key
    assert.strictEqual(decrypt(savedPayload.value), newRawApiKey)
  })

  it("does not return stored secret value in getOne", async (t) => {
    const getSelectedFields = mockCredentialSelect(t, {
      id: TEST_CREDENTIAL_ID,
      name: "My OpenAI Key",
      type: CredentialType.OPENAI,
      ...timestamps(),
    })

    const credential = await caller.getOne({ id: TEST_CREDENTIAL_ID })
    assert.strictEqual(credential.id, TEST_CREDENTIAL_ID)
    assert.strictEqual(getSelectedFields().includes("value"), false)
    assert.strictEqual((credential as Record<string, unknown>).value, undefined)
  })
})
