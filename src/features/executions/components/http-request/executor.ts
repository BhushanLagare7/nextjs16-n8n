import Handlebars from "handlebars"
import { NonRetriableError } from "inngest"
import ky, { type Options as KyOptions } from "ky"

import type { NodeExecutor } from "@/features/executions/types"

/** Custom Handlebars helper to stringify nested objects or variables as pretty JSON */
Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2)
  const safeString = new Handlebars.SafeString(jsonString)

  return safeString
})

/**
 * Configuration schema for an HTTP request node.
 *
 * @property variableName Name under which the response is stored in context.
 * @property endpoint     Target URL for the request (supports template strings).
 * @property method       HTTP verb to use.
 * @property body         Raw request body (supports template strings; POST/PUT/PATCH only).
 */
type HttpRequestData = {
  variableName: string
  endpoint: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: string
}

/**
 * Executor for HTTP request nodes.
 *
 * Resolves templated parameters (endpoint URL, request body) using Handlebars
 * and the current execution context. Executes the HTTP call within an Inngest step,
 * then maps the response to a custom variable in context.
 *
 * Throws {@link NonRetriableError} on configuration or payload syntax validation failures.
 */
export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  // TODO: Publish "loading" state for http request

  // Endpoint is required; fail fast without retry if missing
  if (!data.endpoint) {
    // TODO: Publish "error" state for http request
    throw new NonRetriableError("HTTP Request node: No endpoint configured")
  }

  // Variable name is required so downstream nodes can reference the result
  if (!data.variableName) {
    // TODO: Publish "error" state for http request
    throw new NonRetriableError("Variable name not configured")
  }

  // Method is required; fail fast without retry if missing
  if (!data.method) {
    throw new NonRetriableError("HTTP Request node: No method configured")
  }

  // Wrap network call in step.run so Inngest can memoize and replay safely
  const result = await step.run("http-request", async () => {
    // Interpolate variable templates in the endpoint URL
    const endpoint = Handlebars.compile(data.endpoint)(context)
    const method = data.method

    const options: KyOptions = { method }

    // Only attach and parse a body for payload-carrying methods
    if (["POST", "PUT", "PATCH"].includes(method)) {
      // Interpolate variable templates in the body payload
      const resolved = Handlebars.compile(data.body || "{}")(context)

      // Enforce valid JSON structure before transmission; throws error if invalid
      JSON.parse(resolved)

      options.body = resolved
      options.headers = { "Content-Type": "application/json" }
    }

    const response = await ky(endpoint, options)

    // Parse JSON when advertised by the server, otherwise fall back to text
    const contentType = response.headers.get("content-type")
    const responseData = contentType?.includes("application/json")
      ? await response.json()
      : await response.text()

    // Normalized response layout for downstream templating engines
    const responsePayload = {
      httpResponse: {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      },
    }

    // Assign payload directly under the configured variable key in context
    return {
      ...context,
      [data.variableName]: responsePayload,
    }
  })

  // TODO: Publish "success" state for http request

  return result
}
