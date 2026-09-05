import { TRPCError } from "@trpc/server"
import type { Edge, Node } from "@xyflow/react"
import { generateSlug } from "random-word-slugs"
import { z } from "zod"

import { NodeType, PAGINATION } from "@/config/constants"
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
  /** Creates a new workflow with an initial node. Requires a premium plan. */
  create: premiumProcedure.mutation(async ({ ctx }) => {
    // Transaction so a workflow is never left without its initial node
    return db.transaction(async (tx) => {
      const workflow = await tx.orm.public.Workflow.create({
        name: generateSlug(3), // e.g. "brave-quiet-otter"
        userId: ctx.auth.user.id,
      })

      // Seed the canvas with a single initial node at the origin
      await tx.orm.public.Node.create({
        workflowId: workflow.id,
        name: NodeType.INITIAL,
        type: NodeType.INITIAL,
        position: { x: 0, y: 0 },
      })

      return workflow
    })
  }),

  /** Deletes a workflow owned by the current user */
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Scoping by userId also handles cross-user access as "not found"
      const workflow = await db.orm.public.Workflow.where({
        id: input.id,
        userId: ctx.auth.user.id,
      }).delete()

      // Also covers workflows that exist but belong to another user
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

  /** Updates a workflow's nodes and edges, scoped to the current user */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.enum(Object.values(NodeType) as [string, ...string[]]).nullish(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(),
          })
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input

      // Verify ownership before mutating anything
      const workflow = await db.orm.public.Workflow.where({
        id,
        userId: ctx.auth.user.id,
      }).first()

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        })
      }

      // Transaction to ensure consistency
      return db.transaction(async (tx) => {
        // Validate that every edge references a node being submitted
        const nodeIdSet = new Set(nodes.map((n) => n.id))
        for (const edge of edges) {
          if (!nodeIdSet.has(edge.source) || !nodeIdSet.has(edge.target)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Edge references unknown node: source="${edge.source}", target="${edge.target}"`,
            })
          }
        }

        // Delete existing nodes and connections (cascade deletes connections)
        await tx.orm.public.Node.where({ workflowId: id }).deleteAll()

        // Create nodes
        await tx.orm.public.Node.createAll(
          nodes.map((node) => ({
            id: node.id,
            workflowId: id,
            name: node.type || "unknown",
            type: (node.type as NodeType) || NodeType.INITIAL,
            position: node.position,
            data: node.data || {},
          }))
        )

        // Create connections; default handle names mirror the React Flow convention
        await tx.orm.public.Connection.createAll(
          edges.map((edge) => ({
            workflowId: id,
            fromNodeId: edge.source,
            toNodeId: edge.target,
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
          }))
        )

        // Update workflow's updatedAt timestamp
        await tx.orm.public.Workflow.where({ id }).update({
          updatedAt: new Date().toISOString(),
        })

        return workflow
      })
    }),

  /** Fetches a single workflow by id, scoped to the current user with react-flow compatible nodes and edges */
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await db.orm.public.Workflow.where({
        id: input.id,
        userId: ctx.auth.user.id,
      })
        // Select only the fields the canvas needs
        .include("nodes", (node) =>
          node.select("id", "type", "position", "data")
        )
        .include("connections", (conn) =>
          conn.select("id", "fromNodeId", "toNodeId", "fromOutput", "toInput")
        )
        .first()

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        })
      }

      // Transform server nodes to react-flow compatible nodes
      const nodes: Node[] = workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position as { x: number; y: number }, // stored as JSON
        data: (node.data as Record<string, unknown>) || {},
      }))

      // Transform server connections to react-flow compatible edges
      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }))

      return {
        id: workflow.id,
        name: workflow.name,
        nodes,
        edges,
      }
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
          .orderBy((w) => w.updatedAt.desc()) // most recently edited first
          .offset((page - 1) * pageSize)
          .limit(pageSize)
          .all(),
        query.aggregate((agg) => ({
          count: agg.count(),
        })),
      ])

      // Derive pagination metadata for the client
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
