import { NonRetriableError } from "inngest"
import ky, { type Options as KyOptions } from "ky"

import type { NodeExecutor } from "@/features/executions/types"

/** Configuration schema for an HTTP request node. */
type HttpRequestData = {
  endpoint?: string
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: string
}

/**
 * Executor for HTTP request nodes.
 * Performs the request inside an Inngest step for durability
 * and merges the response into the workflow context under `httpResponse`.
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

  // Wrap network call in step.run so Inngest can memoize and replay safely
  const result = await step.run("http-request", async () => {
    const endpoint = data.endpoint!
    const method = data.method || "GET"

    const options: KyOptions = { method }

    // Only attach a body for methods that support one
    if (["POST", "PUT", "PATCH"].includes(method)) {
      options.body = data.body
    }

    const response = await ky(endpoint, options)

    // Parse JSON when advertised by the server, otherwise fall back to text
    const contentType = response.headers.get("content-type")
    const responseData = contentType?.includes("application/json")
      ? await response.json()
      : await response.text()

    return {
      ...context,
      httpResponse: {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      },
    }
  })

  // TODO: Publish "success" state for http request

  return result
}
