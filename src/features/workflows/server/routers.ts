import { TRPCError } from "@trpc/server"
import { generateSlug } from "random-word-slugs"
import { z } from "zod"

import { PAGINATION } from "@/config/constants"
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
  /** Creates a new workflow with a randomly generated name. Requires a premium plan. */
  create: premiumProcedure.mutation(({ ctx }) => {
    return db.orm.public.Workflow.create({
      name: generateSlug(3),
      userId: ctx.auth.user.id,
    })
  }),

  /** Deletes a workflow owned by the current user */
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await db.orm.public.Workflow.where({
        id: input.id,
        userId: ctx.auth.user.id,
      }).delete()

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        })
      }

      return workflow
    }),

  /** Renames a workflow owned by the current user */
  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await db.orm.public.Workflow.where({
        id: input.id,
        userId: ctx.auth.user.id,
      }).update({ name: input.name })

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        })
      }

      return workflow
    }),

  /** Fetches a single workflow by id, scoped to the current user */
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await db.orm.public.Workflow.where({
        id: input.id,
        userId: ctx.auth.user.id,
      }).first()

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        })
      }

      return workflow
    }),

  /** Fetches workflows belonging to the current user with pagination and search */
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .int()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input

      // Base query: only workflows owned by the current user
      let query = db.orm.public.Workflow.where((w) =>
        w.userId.eq(ctx.auth.user.id)
      )

      // Optional case-insensitive name filter
      if (search) {
        query = query.where((w) => w.name.ilike(`%${search}%`))
      }

      // Run the paginated fetch and total count concurrently
      const [items, total] = await Promise.all([
        query
          .orderBy((w) => w.updatedAt.desc())
          .offset((page - 1) * pageSize)
          .limit(pageSize)
          .all(),
        query.aggregate((agg) => ({
          count: agg.count(),
        })),
      ])

      const totalCount = total.count
      const totalPages = Math.ceil(totalCount / pageSize)
      const hasNextPage = page < totalPages
      const hasPreviousPage = page > 1

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      }
    }),
})
