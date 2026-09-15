import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { CredentialType, PAGINATION } from "@/config/constants"
import { db } from "@/prisma/db"
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init"

/**
 * tRPC router for credential CRUD operations and provider lookup.
 * All procedures require authentication and scope operations to the current user.
 */
export const credentialsRouter = createTRPCRouter({
  create: premiumProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        type: z.enum([
          CredentialType.OPENAI,
          CredentialType.ANTHROPIC,
          CredentialType.GEMINI,
        ]),
        value: z.string().min(1, "Value is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, value, type } = input

      return db.orm.public.Credential.create({
        name,
        userId: ctx.auth.user.id,
        type,
        value, // TODO: Consider encrypting in production
      })
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const credential = await db.orm.public.Credential.where({
        id: input.id,
        userId: ctx.auth.user.id,
      }).delete()

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        })
      }

      return credential
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
        type: z.enum([
          CredentialType.OPENAI,
          CredentialType.ANTHROPIC,
          CredentialType.GEMINI,
        ]),
        value: z.string().min(1, "Value is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, type, value } = input

      const credential = await db.orm.public.Credential.where({
        id,
        userId: ctx.auth.user.id,
      }).update({
        name,
        type,
        value, // TODO: Consider encrypting in production
      })

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        })
      }

      return credential
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const credential = await db.orm.public.Credential.where({
        id: input.id,
        userId: ctx.auth.user.id,
      }).first()

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        })
      }

      return credential
    }),

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

      let query = db.orm.public.Credential.where((c) =>
        c.userId.eq(ctx.auth.user.id)
      )

      if (search) {
        query = query.where((c) => c.name.ilike(`%${search}%`))
      }

      const [items, total] = await Promise.all([
        query
          .orderBy((c) => c.updatedAt.desc())
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

  getByType: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          CredentialType.OPENAI,
          CredentialType.ANTHROPIC,
          CredentialType.GEMINI,
        ]),
      })
    )
    .query(async ({ ctx, input }) => {
      const { type } = input

      return db.orm.public.Credential.where((c) =>
        c.userId.eq(ctx.auth.user.id)
      )
        .where((c) => c.type.eq(type))
        .orderBy((c) => c.updatedAt.desc())
        .all()
    }),
})
