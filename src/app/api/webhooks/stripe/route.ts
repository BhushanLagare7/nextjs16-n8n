import { type NextRequest, NextResponse } from "next/server"

import { sendWorkflowExecution } from "@/inngest/utils"
import { db } from "@/prisma/db"

/**
 * Webhook endpoint for Stripe events.
 * Validates the target workflow ID, parses the Stripe event payload, and
 * dispatches an Inngest execution with formatted Stripe event data.
 *
 * @param request - Expects a `workflowId` query parameter and a JSON body
 * containing the Stripe event object.
 * @returns 200 on success, 400 for missing params or malformed body, 500 on failure.
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const workflowId = url.searchParams.get("workflowId")

    if (!workflowId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required query parameter: workflowId",
        },
        { status: 400 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON body" },
        { status: 400 }
      )
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Request body must be a JSON object" },
        { status: 400 }
      )
    }

    const parsed = body as Record<string, unknown>
    const rawObject = (parsed.data as Record<string, unknown> | undefined)
      ?.object as Record<string, unknown> | undefined

    const stripeData = {
      // Event metadata
      eventId: parsed.id,
      eventType: parsed.type,
      timestamp: parsed.created,
      livemode: parsed.livemode,
      raw: rawObject,
      // Convenience shortcuts matching dialog documentation
      amount: rawObject?.amount,
      currency: rawObject?.currency,
      customerId:
        rawObject?.customer ?? rawObject?.customer_id ?? rawObject?.customerId,
    }

    const workflow = await db.orm.public.Workflow.where({
      id: workflowId,
    })
      .select("userId")
      .first()

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 }
      )
    }

    // Trigger an Inngest job
    await sendWorkflowExecution({
      workflowId,
      userId: workflow.userId,
      initialData: {
        stripe: stripeData,
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process Stripe event" },
      { status: 500 }
    )
  }
}
