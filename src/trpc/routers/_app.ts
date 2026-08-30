import { db } from "@/prisma/db"

import { createTRPCRouter, protectedProcedure } from "../init"

/**
 * Root tRPC router.
 * All procedures exposed to the client are defined here.
 */
export const appRouter = createTRPCRouter({
  /** Fetches all users from the database. */
  getUsers: protectedProcedure.query(async () => {
    return await db.orm.public.User.all()
  }),
})

// export type definition of API
export type AppRouter = typeof appRouter
