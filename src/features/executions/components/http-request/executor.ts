import Handlebars from "handlebars"
import { NonRetriableError } from "inngest"
import ky, { type Options as KyOptions } from "ky"

import type { NodeExecutor } from "@/features/executions/types"
import { httpRequestChannel } from "@/inngest/channels/http-request"

/** Stringifies a value as pretty-printed JSON for use in templates. */
Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2)
  return new Handlebars.SafeString(jsonString)
})

/** URL-encodes a value for safe interpolation into endpoint URLs. */
Handlebars.registerHelper("encodeURI", (context) => {
  return new Handlebars.SafeString(encodeURIComponent(String(context)))
})

/**
 * Configuration schema for an HTTP request node.
 *
 * @property variableName - Key under which the response is stored in context.
 * @property endpoint - Target URL for the request (supports Handlebars templates).
 * @property method - HTTP verb to use.
 * @property body - Raw request body (supports Handlebars templates; POST/PUT/PATCH only).
 */
type HttpRequestData = {
  variableName: string
  endpoint: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: string
}

/**
 * Executes an HTTP request node.
 *
 * Resolves templated fields (endpoint, body) against the current execution
 * context, performs the request inside an Inngest step for durability, and
 * writes the response back into context under `variableName`.
 *
 * @throws {NonRetriableError} If the endpoint is missing or the interpolated body is not valid JSON.
 */
export const httpRequestExecutor: NodeExecutor = async ({
  data: rawData,
  nodeId,
  context,
  step,
  publish,
}) => {
  // Node data is untyped at the DB layer; fields are validated/defaulted
  // below to stay compatible with nodes persisted before this shape existed.
  const data = rawData as Partial<HttpRequestData>

  await publish(`http-request-loading-${nodeId}`, httpRequestChannel.status, {
    nodeId,
    status: "loading",
  })

  if (!data.endpoint) {
    await publish(
      `http-request-error-no-endpoint-${nodeId}`,
      httpRequestChannel.status,
      { nodeId, status: "error" }
    )
    throw new NonRetriableError("HTTP Request node: No endpoint configured")
  }

  const variableName = data.variableName || "httpResponse"
  const method = data.method || "GET"

  try {
    // step.run memoizes the network call so replays don't re-fire the request
    const result = await step.run("http-request", async () => {
      // noEscape avoids HTML-escaping interpolated values; users can
      // opt into URL-encoding explicitly via {{encodeURI varName}}
      const endpoint = Handlebars.compile(data.endpoint, { noEscape: true })(
        context
      )

      const options: KyOptions = { method }

      if (["POST", "PUT", "PATCH"].includes(method)) {
        const resolved = Handlebars.compile(data.body || "{}", {
          noEscape: true,
        })(context)

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

      const contentType = response.headers.get("content-type")
      const responseData = contentType?.includes("application/json")
        ? await response.json()
        : await response.text()

      const responsePayload = {
        httpResponse: {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        },
      }

      return {
        ...context,
        [variableName]: responsePayload,
      }
    })

    await publish(`http-request-success-${nodeId}`, httpRequestChannel.status, {
      nodeId,
      status: "success",
    })

    return result
  } catch (error) {
    await publish(`http-request-error-${nodeId}`, httpRequestChannel.status, {
      nodeId,
      status: "error",
    })
    throw error
  }
}
