import { type NextRequest, NextResponse } from "next/server"

import { sendWorkflowExecution } from "@/inngest/utils"

/**
 * Webhook endpoint for Google Form submissions.
 * Validates the target workflow ID and dispatches an Inngest execution
 * with the submitted form data.
 *
 * @param request - Expects a `workflowId` query param and a JSON body
 * containing the form submission payload.
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

    if (!parsed.formId || !parsed.responseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: formId, responseId",
        },
        { status: 400 }
      )
    }

    const formData = {
      formId: parsed.formId,
      formTitle: parsed.formTitle,
      responseId: parsed.responseId,
      timestamp: parsed.timestamp,
      respondentEmail: parsed.respondentEmail,
      responses: parsed.responses,
      raw: parsed,
    }

    await sendWorkflowExecution({
      workflowId,
      initialData: {
        googleForm: formData,
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Google form webhook error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process Google Form submission" },
      { status: 500 }
    )
  }
}
