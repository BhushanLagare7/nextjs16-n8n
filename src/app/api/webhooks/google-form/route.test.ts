import { NextRequest } from "next/server"

import assert from "node:assert"
import { describe, it } from "node:test"

import { inngest } from "@/inngest/client"

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
    const inngestSendMock = t.mock.method(inngest, "send", async () => ({
      ids: ["evt_test_123"],
    }))

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
    assert.deepStrictEqual(inngestSendMock.mock.calls[0]?.arguments[0], {
      name: "workflows/execute.workflow",
      data: {
        workflowId: "wf-999",
        initialData: {
          googleForm: {
            ...payload,
            raw: payload,
          },
        },
      },
    })
  })
})
