import { generateSlug } from "random-word-slugs"
import { z } from "zod"

import { db } from "@/prisma/db"
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init"

/**
 * tRPC router for workflow CRUD operations.
 * All procedures require authentication and scope results to the current user.
 */
export const workflowsRouter = createTRPCRouter({
  /** Creates a new workflow with a randomly generated name */
  create: premiumProcedure.mutation(({ ctx }) => {
    return db.orm.public.Workflow.create({
      name: generateSlug(3),
      userId: ctx.auth.user.id,
    })
  }),

  /** Deletes a workflow owned by the current user */
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return db.orm.public.Workflow.where({
        id: input.id,
        userId: ctx.auth.user.id,
      }).delete()
    }),

  /** Renames a workflow owned by the current user */
  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return db.orm.public.Workflow.where({
        id: input.id,
        userId: ctx.auth.user.id,
      }).update({ name: input.name })
    }),

  /** Fetches a single workflow by id, scoped to the current user */
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return db.orm.public.Workflow.where({
        id: input.id,
        userId: ctx.auth.user.id,
      }).first()
    }),

  /** Fetches all workflows belonging to the current user */
  getMany: protectedProcedure.query(({ ctx }) => {
    return db.orm.public.Workflow.where({
      userId: ctx.auth.user.id,
    }).all()
  }),
})
