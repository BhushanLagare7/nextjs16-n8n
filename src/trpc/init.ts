import { cache } from "react"
import { headers } from "next/headers"

import { initTRPC, TRPCError } from "@trpc/server"

import { auth } from "@/lib/auth"
import { polarClient } from "@/lib/polar"

/**
 * tRPC server setup with three procedure tiers:
 * public -> protected (auth) -> premium (active subscription)
 */

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
  // Fetch session using incoming request headers, or reuse session provided in ctx
  const session =
    (ctx as { auth?: typeof auth.$Infer.Session | null }).auth ??
    (await auth.api.getSession({
      headers: await headers(),
    }))

  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unathorized" })
  }

  // Pass session down to downstream procedures via context
  return next({ ctx: { ...ctx, auth: session } })
})

/**
 * Procedure that enforces an active subscription.
 * Builds on `protectedProcedure`, so auth is guaranteed here.
 * Throws FORBIDDEN if the user has no active subscription,
 * otherwise attaches Polar customer data to context as `customer`.
 */
export const premiumProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    // Look up subscription/customer state from Polar using the authenticated user's ID
    const customer = await polarClient.customers.getStateExternal({
      externalId: ctx.auth.user.id,
    })

    if (
      !customer.activeSubscriptions ||
      customer.activeSubscriptions.length === 0
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Active subscription required",
      })
    }

    return next({ ctx: { ...ctx, customer } })
  }
)
