import * as Sentry from "@sentry/nextjs"

/**
 * Next.js instrumentation hook. Loads the appropriate Sentry config
 * based on the active runtime (Node.js or Edge).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

/** Reports uncaught request errors to Sentry. */
export const onRequestError = Sentry.captureRequestError
