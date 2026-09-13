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

  it("handles duplicate question titles without overwriting", () => {
    const script = generateGoogleFormScript("https://example.com")

    // The script should track title occurrences and append a suffix
    assert(
      script.includes("titleCount"),
      "Script should use a titleCount tracker for deduplication"
    )
    assert(
      script.includes("title + '_' + titleCount[title]"),
      "Script should append a numeric suffix for duplicate titles"
    )
  })
})
