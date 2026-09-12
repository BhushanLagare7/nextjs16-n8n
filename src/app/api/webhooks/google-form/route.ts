import { type NextRequest, NextResponse } from "next/server"

import { sendWorkflowExecution } from "@/inngest/utils"

/**
 * Webhook endpoint for Google Form submissions.
 * Validates the target workflow ID and dispatches an Inngest execution
 * with the submitted form data.
 *
 * @param request - Expects a `workflowId` query param and a JSON body
 * containing the form submission payload.
 * @returns 200 on success, 400 for missing params, 500 on failure.
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

    const body = await request.json()

    const formData = {
      formId: body.formId,
      formTitle: body.formTitle,
      responseId: body.responseId,
      timestamp: body.timestamp,
      respondentEmail: body.respondentEmail,
      responses: body.responses,
      raw: body,
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
