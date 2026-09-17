import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { PAGINATION } from "@/config/constants"
import { db } from "@/prisma/db"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"

/**
 * tRPC router for workflow executions.
 * All procedures require authentication and scope results to workflows owned by the current user.
 */
export const executionsRouter = createTRPCRouter({
  /** Fetches a single execution by id, scoped to workflows owned by the current user */
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const execution = await db.orm.public.Execution.where({
        id: input.id,
      })
        .include("workflow", (wf) => wf.select("id", "name", "userId"))
        .first()

      if (!execution || execution.workflow?.userId !== ctx.auth.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Execution not found",
        })
      }

      return execution
    }),

  /** Fetches workflow executions for the current user's workflows with pagination */
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
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input

      // Fetch all workflow IDs owned by the current user
      const userWorkflows = await db.orm.public.Workflow.where({
        userId: ctx.auth.user.id,
      })
        .select("id")
        .all()

      const workflowIds = userWorkflows.map((w) => w.id)

      if (workflowIds.length === 0) {
        return {
          items: [],
          page,
          pageSize,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      }

      const query = db.orm.public.Execution.where((e) =>
        e.workflowId.in(workflowIds)
      )

      const [items, total] = await Promise.all([
        query
          .include("workflow", (wf) => wf.select("id", "name"))
          .orderBy([(e) => e.startedAt.desc(), (e) => e.id.desc()])
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
