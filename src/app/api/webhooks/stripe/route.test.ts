import { NextRequest } from "next/server"

import assert from "node:assert"
import { describe, it } from "node:test"

import { inngest } from "@/inngest/client"

import { POST } from "./route"

describe("POST /api/webhooks/stripe", () => {
  it("returns 400 when workflowId query parameter is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ id: "evt_123" }),
    })

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
      "http://localhost:3000/api/webhooks/stripe?workflowId=wf-1",
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

  it("returns 400 when body is null or not an object", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/stripe?workflowId=wf-1",
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

  it("dispatches inngest event with stripe data and returns 200 on valid webhook", async (t) => {
    const inngestSendMock = t.mock.method(inngest, "send", async () => ({
      ids: ["evt_test_123"],
    }))

    const payload = {
      id: "evt_3Mkoq2LkdIwHu7ix0snNqP0",
      type: "payment_intent.succeeded",
      created: 1679000000,
      livemode: false,
      data: {
        object: {
          id: "pi_123",
          amount: 2000,
          currency: "usd",
          customer: "cus_abc",
        },
      },
    }

    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/stripe?workflowId=wf-stripe-1",
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
        workflowId: "wf-stripe-1",
        initialData: {
          stripe: {
            eventId: "evt_3Mkoq2LkdIwHu7ix0snNqP0",
            eventType: "payment_intent.succeeded",
            timestamp: 1679000000,
            livemode: false,
            raw: payload.data.object,
            amount: 2000,
            currency: "usd",
            customerId: "cus_abc",
          },
        },
      },
    })
  })

  it("returns 500 when dispatching execution throws an error", async (t) => {
    t.mock.method(inngest, "send", async () => {
      throw new Error("Inngest unavailable")
    })

    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/stripe?workflowId=wf-stripe-1",
      {
        method: "POST",
        body: JSON.stringify({
          id: "evt_123",
          type: "payment_intent.succeeded",
        }),
      }
    )

    const res = await POST(req)
    assert.strictEqual(res.status, 500)

    const json = await res.json()
    assert.strictEqual(json.success, false)
    assert.strictEqual(json.error, "Failed to process Stripe event")
  })
})
