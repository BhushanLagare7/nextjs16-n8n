import { NextRequest } from "next/server"

import assert from "node:assert"
import { describe, it } from "node:test"

import {
  mockInngestSend,
  mockInngestSendFailure,
  mockWorkflowFound,
  mockWorkflowNotFound,
} from "../route-test-helpers"

import { POST } from "./route"

describe("POST /api/webhooks/google-form", () => {
  it("returns 400 when workflowId query parameter is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/google-form",
      {
        method: "POST",
        body: JSON.stringify({ formId: "123" }),
      }
    )

    const res = await POST(req)
    assert.strictEqual(res.status, 400)

    const json = await res.json()
    assert.strictEqual(json.success, false)
    assert.strictEqual(
      json.error,
      "Missing required query parameter: workflowId"
    )
  })

  it("returns 400 for malformed JSON body", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/google-form?workflowId=wf-1",
      {
        method: "POST",
        body: "not-json{{{",
        headers: { "Content-Type": "application/json" },
      }
    )

    const res = await POST(req)
    assert.strictEqual(res.status, 400)

    const json = await res.json()
    assert.strictEqual(json.success, false)
    assert.strictEqual(json.error, "Malformed JSON body")
  })

  it("returns 400 when body is null", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/google-form?workflowId=wf-1",
      {
        method: "POST",
        body: JSON.stringify(null),
        headers: { "Content-Type": "application/json" },
      }
    )

    const res = await POST(req)
    assert.strictEqual(res.status, 400)

    const json = await res.json()
    assert.strictEqual(json.success, false)
    assert.strictEqual(json.error, "Request body must be a JSON object")
  })

  it("returns 400 when required fields are missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/google-form?workflowId=wf-1",
      {
        method: "POST",
        body: JSON.stringify({ formTitle: "Some form" }),
      }
    )

    const res = await POST(req)
    assert.strictEqual(res.status, 400)

    const json = await res.json()
    assert.strictEqual(json.success, false)
    assert.strictEqual(
      json.error,
      "Missing required fields: formId, responseId"
    )
  })

  it("dispatches inngest event with googleForm data and returns 200 on valid submission", async (t) => {
    mockWorkflowFound(t, { userId: "user-form-owner" })
    const inngestSendMock = mockInngestSend(t)

    const payload = {
      formId: "form_abc",
      formTitle: "Customer Feedback",
      responseId: "resp_xyz",
      timestamp: "2026-09-10T12:00:00Z",
      respondentEmail: "respondent@example.com",
      responses: {
        "What is your name?": "Alice",
      },
    }

    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/google-form?workflowId=wf-999",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    )

    const res = await POST(req)
    assert.strictEqual(res.status, 200)

    const json = await res.json()
    assert.strictEqual(json.success, true)

    assert.strictEqual(inngestSendMock.mock.calls.length, 1)
    const callArg = inngestSendMock.mock.calls[0]?.arguments[0] as {
      name: string
      data: unknown
      id: string
    }
    assert.strictEqual(callArg.name, "workflows/execute.workflow")
    assert.deepStrictEqual(callArg.data, {
      workflowId: "wf-999",
      userId: "user-form-owner",
      initialData: {
        googleForm: {
          ...payload,
          raw: payload,
        },
      },
    })
    assert.strictEqual(typeof callArg.id, "string")
  })

  it("returns 404 when workflow is not found", async (t) => {
    mockWorkflowNotFound(t)

    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/google-form?workflowId=wf-nonexistent",
      {
        method: "POST",
        body: JSON.stringify({
          formId: "form_abc",
          responseId: "resp_xyz",
        }),
      }
    )

    const res = await POST(req)
    assert.strictEqual(res.status, 404)

    const json = await res.json()
    assert.strictEqual(json.success, false)
    assert.strictEqual(json.error, "Workflow not found")
  })

  it("returns 500 when dispatching execution throws an error", async (t) => {
    mockWorkflowFound(t, { userId: "user-form-owner" })
    mockInngestSendFailure(t)

    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/google-form?workflowId=wf-999",
      {
        method: "POST",
        body: JSON.stringify({
          formId: "form_abc",
          responseId: "resp_xyz",
        }),
      }
    )

    const res = await POST(req)
    assert.strictEqual(res.status, 500)

    const json = await res.json()
    assert.strictEqual(json.success, false)
    assert.strictEqual(json.error, "Failed to process Google Form submission")
  })
})
