<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — nextjs16-n8n

Visual workflow automation platform (inspired by n8n) built with **Next.js 16**, **React 19**, **Prisma Next**, and **Inngest v4**. Users design workflows as node graphs on a canvas and execute them as durable background jobs.

---

## Non-Negotiable Core Invariants

You MUST adhere to these critical rules across all tasks without exception:

1. **Pre-Commit Verification**: Always run `npm run format:check && npm run lint && npm run typecheck` before completing any task.
2. **Prisma Next (NOT standard Prisma)**: The database uses `@prisma/orm-postgres`. There is **NO** `prisma/schema.prisma` and **NO** `prisma generate`. The single source of truth is `src/prisma/contract.prisma`. Update it and run `npm run contract:emit`.
3. **Next.js 16 Async Route Params**: Dynamic route `params` and `searchParams` are Promises — always `await` them (`const { id } = await params`).
4. **React Hook Form**: NEVER call `form.watch()` directly (breaks React Compiler memoization). Always use `useWatch` from `react-hook-form`.
5. **Inngest v4 Durability**: ALL side effects (DB updates, network calls) inside durable functions MUST be wrapped in `step.run()`.

---

## Documentation Router

Detailed architecture guides and conventions have been modularized in the `docs/` directory to save context tokens. **Read the relevant document before writing code in that domain:**

| Topic                      | Document                                                               | When to Consult                                                                                         |
| :------------------------- | :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **Architecture & Nodes**   | [`docs/architecture.md`](docs/architecture.md)                         | Understanding tech stack, directory structure, workflow pipeline, or adding a new node type             |
| **Development & Setup**    | [`docs/development-workflow.md`](docs/development-workflow.md)         | Setting up env vars, starting dev servers (`mprocs`, `inngest:dev`, `ngrok`), or running CLI commands   |
| **Code Style & Types**     | [`docs/code-conventions.md`](docs/code-conventions.md)                 | Prettier formatting, ESLint import sorting, JSX prop ordering, TypeScript strict types, or Zod schemas  |
| **Next.js & React**        | [`docs/nextjs-react-conventions.md`](docs/nextjs-react-conventions.md) | Writing App Router pages/layouts, async params, React 19 patterns, or React Hook Form integration       |
| **Database (Prisma Next)** | [`docs/database-conventions.md`](docs/database-conventions.md)         | Modifying data contracts, emitting types, querying `db.orm.public.*`, or reusing `FieldOutputTypes`     |
| **Background Jobs**        | [`docs/inngest-conventions.md`](docs/inngest-conventions.md)           | Writing durable Inngest functions, steps (`step.run`, `step.sleep`), DAG sorting, or realtime streaming |
| **Testing**                | [`docs/testing-conventions.md`](docs/testing-conventions.md)           | Writing or running tests (`tsx --test`), test placement, or assertion conventions                       |
| **Observability**          | [`docs/observability-debugging.md`](docs/observability-debugging.md)   | Sentry runtime configurations, error boundaries, or debugging workflows                                 |

---

## Skills Reference

Specialized agent skills are auto-discovered from `.agents/skills/`. Consult the relevant skill before implementing complex workflows (e.g. `prisma-next-*`, `inngest-*`, `sentry-*`, `react-flow`, `ai-sdk`, `shadcn`).
