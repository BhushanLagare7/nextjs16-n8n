import { cache } from "react"
import { headers } from "next/headers"

import { initTRPC, TRPCError } from "@trpc/server"

import { auth } from "@/lib/auth"

/**
 * Creates the tRPC context for each request.
 * Wrapped in `cache` so multiple calls within
 * the same request return the same context.
 */
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: "user_123" }
})

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
})

// Base router and procedure helpers
export const createTRPCRouter = t.router

export const createCallerFactory = t.createCallerFactory

// Public procedure — no auth required
export const baseProcedure = t.procedure

/**
 * Procedure that enforces authentication.
 * Throws UNAUTHORIZED if no valid session exists,
 * otherwise attaches the session to context as `auth`.
 */
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  // Fetch session using incoming request headers
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unathorized" })
  }

  // Pass session down to downstream procedures via context
  return next({ ctx: { ...ctx, auth: session } })
})
