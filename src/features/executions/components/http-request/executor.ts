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

/** URL-encode interpolated values for safe use inside endpoint URLs */
Handlebars.registerHelper("encodeURI", (context) => {
  return new Handlebars.SafeString(encodeURIComponent(String(context)))
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
export const httpRequestExecutor: NodeExecutor = async ({
  data: rawData,
  nodeId,
  context,
  step,
}) => {
  // Narrow untyped node data from the DB into the expected shape.
  // Fields are validated/defaulted below so persisted nodes stay compatible.
  const data = rawData as Partial<HttpRequestData>

  // TODO: Publish "loading" state for http request

  // Endpoint is required; fail fast without retry if missing
  if (!data.endpoint) {
    // TODO: Publish "error" state for http request
    throw new NonRetriableError("HTTP Request node: No endpoint configured")
  }

  // Default missing/empty variableName for backward compatibility with
  // persisted nodes that were saved before this field was required.
  const variableName = data.variableName || "httpResponse"

  // Default missing method for backward compatibility with legacy nodes
  const method = data.method || "GET"

  // Wrap network call in step.run so Inngest can memoize and replay safely
  const result = await step.run("http-request", async () => {
    // Interpolate variable templates in the endpoint URL.
    // Uses {{{triple-stache}}} to prevent Handlebars HTML-escaping, and
    // users can opt into URL-encoding via {{encodeURI varName}}.
    const endpoint = Handlebars.compile(data.endpoint, { noEscape: true })(
      context
    )

    const options: KyOptions = { method }

    // Only attach and parse a body for payload-carrying methods
    if (["POST", "PUT", "PATCH"].includes(method)) {
      // Interpolate variable templates in the body payload.
      // noEscape prevents Handlebars from HTML-encoding values inside JSON.
      const resolved = Handlebars.compile(data.body || "{}", {
        noEscape: true,
      })(context)

      // Enforce valid JSON structure before transmission
      try {
        JSON.parse(resolved)
      } catch (error) {
        throw new NonRetriableError(
          `HTTP Request node: Malformed JSON body after template interpolation`,
          { cause: error }
        )
      }

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
      [variableName]: responsePayload,
    }
  })

  // TODO: Publish "success" state for http request

  return result
}
