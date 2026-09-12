import assert from "node:assert"
import { describe, it } from "node:test"

import { generateGoogleFormScript } from "./utils"

describe("generateGoogleFormScript", () => {
  it("interpolates webhookUrl into the Google Apps Script output", () => {
    const testUrl =
      "https://example.com/api/webhooks/google-form?workflowId=wf-123"
    const script = generateGoogleFormScript(testUrl)

    assert(script.includes(`var WEBHOOK_URL = '${testUrl}';`))
    assert(script.includes("function onFormSubmit(e)"))
    assert(script.includes("UrlFetchApp.fetch(WEBHOOK_URL, options)"))
    assert(
      script.includes("respondentEmail: formResponse.getRespondentEmail()")
    )
    assert(script.includes("formTitle: e.source.getTitle()"))
  })
})
