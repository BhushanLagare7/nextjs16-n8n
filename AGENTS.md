<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — nextjs16-n8n

Welcome to the **nextjs16-n8n** codebase. This document serves as the primary technical operating manual for AI coding agents working in this repository. It defines project architecture, core commands, code conventions, and a comprehensive guide to all **44 installed skills** located in `.agents/skills/`.

---

## 1. Project Overview & Architecture

**nextjs16-n8n** is a full-featured visual workflow automation platform (inspired by n8n) built with modern Next.js and event-driven architecture.

### Technology Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`, `tw-animate-css`) + shadcn/ui
- **Workflow Canvas**: React Flow (`@xyflow/react`) for interactive node graph editing
- **Database & ORM**: **Prisma Next / Prisma ORM 8** (`@prisma/orm-postgres`, `contract.prisma`, `db.orm`) with PostgreSQL
- **Background Jobs & Event Orchestration**: Inngest (`inngest`, `inngest-cli`)
- **API & Data Fetching**: tRPC v11 (`@trpc/server`, `@trpc/client`) + TanStack React Query v5
- **Authentication & Billing**: Better Auth (`better-auth`) + Polar (`@polar-sh/better-auth`, `@polar-sh/sdk`)
- **AI / LLM Integration**: Vercel AI SDK v7 (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`)
- **Observability & Error Tracking**: Sentry Next.js SDK (`@sentry/nextjs`)

### Directory Structure

```
nextjs16-n8n/
├── .agents/skills/              # 44 Installed agent skills
├── prisma.config.ts             # Prisma CLI configuration
├── src/
│   ├── app/                     # Next.js 16 App Router pages & API routes
│   │   ├── api/inngest/         # Inngest serve handler
│   │   ├── api/trpc/            # tRPC HTTP handler
│   │   └── (auth, dashboard...) # Application UI routes
│   ├── components/              # Shared UI components (shadcn/ui primitives)
│   ├── features/                # Domain-driven feature modules
│   │   ├── auth/                # Authentication & user sessions
│   │   ├── editor/              # Workflow editor & React Flow canvas
│   │   ├── executions/          # Execution engine, executor registry & node executors
│   │   ├── subscriptions/       # Polar billing & subscriptions
│   │   ├── triggers/            # Trigger nodes (manual trigger, webhooks)
│   │   └── workflows/           # Workflow CRUD & graph resolution
│   ├── inngest/                 # Inngest client, event schemas & functions
│   ├── lib/                     # Shared utilities (auth, encryption, helpers)
│   ├── prisma/                  # Database contract & client
│   │   ├── contract.prisma      # Source of truth data contract
│   │   ├── contract.json        # Compiled contract metadata (generated)
│   │   ├── contract.d.ts        # Generated TypeScript contract definitions
│   │   └── db.ts                # Runtime client (db.orm.public.*)
│   ├── trpc/                    # tRPC router definitions & context
│   ├── instrumentation.ts       # Sentry server/edge instrumentation
│   └── instrumentation-client.ts# Sentry client instrumentation & replay
```

---

## 2. Setup & Development Commands

Always run these commands from the repository root:

| Command                 | Description                                                        |
| :---------------------- | :----------------------------------------------------------------- |
| `npm run dev`           | Start Next.js development server (`next dev`)                      |
| `npm run inngest:dev`   | Start local Inngest dev server (`inngest-cli dev`)                 |
| `npm run dev:all`       | Run Next.js and Inngest concurrently using `mprocs`                |
| `npm run build`         | Build production Next.js application                               |
| `npm run contract:emit` | Regenerate Prisma Next contract types (`npx prisma contract emit`) |
| `npm run typecheck`     | Run TypeScript type checking (`tsc --noEmit`)                      |
| `npm run lint`          | Run ESLint check                                                   |
| `npm run lint:fix`      | Automatically fix ESLint issues                                    |
| `npm run format`        | Format code with Prettier and ESLint                               |
| `npm run format:check`  | Verify formatting without modifying files                          |
| `npm run test`          | Run tests with TSX test runner (`tsx --test src/**/*.test.ts`)     |

---

## 3. Project Skills Directory & Routing Guide

The project has **44 specialized skills** installed under `.agents/skills/`. Whenever you perform tasks in this repository, **consult the relevant skill file** before writing code.

### 3.1 Database & ORM Skills (Prisma Next & Prisma ORM 8)

> [!IMPORTANT]
> **This project uses Prisma Next / Prisma ORM 8 (`@prisma/orm-postgres`).**
> Do NOT look for `prisma/schema.prisma` or use `prisma generate`. The database source of truth is `src/prisma/contract.prisma`, compiled via `npx prisma contract emit` into `contract.json` and `contract.d.ts`. Queries are executed via `db.orm.public.<Model>`.

| Skill                                           | Trigger / When to Use                                                                       | Key Instructions                                                                                                                                                                                     |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`prisma-next-contract`**                      | Editing database models, adding columns, relations, indexes, or enums.                      | Modify `src/prisma/contract.prisma`. Always run `npm run contract:emit` afterwards. Never hand-edit `contract.json` or `contract.d.ts`.                                                              |
| **`prisma-next-queries`**                       | Writing database queries, CRUD operations, transactions, projections, or pagination.        | Use `db.orm.public.<Model>` for ORM queries or `db.sql.<table>` for SQL queries. Use `db.transaction(...)` for atomic operations. Remember `.all()` is a thenable and ranges use chained `.where()`. |
| **`prisma-next-migrations`**                    | Creating or applying database migrations.                                                   | Use `db update` or `migration plan` / `migrate`. If editing `migration.ts`, replace sentinel placeholders with `dataTransform` closures.                                                             |
| **`prisma-next-runtime`**                       | Modifying `src/prisma/db.ts`, connection pool config, middleware, or multi-database wiring. | Configures `postgres<Contract>({...})` from `@prisma/orm-postgres/runtime`. Handles global singleton caching in development.                                                                         |
| **`prisma-next-debug`**                         | Diagnosing database runtime crashes, failed emits, type errors, or `PN-*` error codes.      | Analyzes structured error envelopes (e.g. `PN-RUN-3001`, `MIGRATION.HASH_MISMATCH`, drift).                                                                                                          |
| **`prisma-next-migration-review`**              | Reviewing pending migrations before deploy or handling diamond convergence.                 | Checks migration graph status and concurrent migration resolution for CI/CD.                                                                                                                         |
| **`prisma-next-quickstart`**                    | Initial database setup or contract infer against an existing database.                      | High-level orientation and day-to-day workflow guidance.                                                                                                                                             |
| **`prisma-next-build`**                         | Build-time contract emission and bundler integration.                                       | Integrations with Vite/Next.js build hooks.                                                                                                                                                          |
| **`prisma-next-upgrade`**                       | Bumping `@prisma/orm-postgres` or `@prisma/*` dependencies.                                 | Validates package versions, migrations, and breaking changes.                                                                                                                                        |
| **`prisma-next`**                               | Router skill for general/vague Prisma Next inquiries.                                       | Dispatches to the appropriate specific `prisma-next-*` skill.                                                                                                                                        |
| **`prisma-next-supabase`**                      | Supabase integration and Row Level Security (RLS) policies.                                 | Use if integrating Supabase Auth or RLS policies into the Prisma Next contract.                                                                                                                      |
| **`prisma-next-feedback`**                      | Reporting upstream bugs or drafting Discord/GitHub inquiries for Prisma Next.               | Formatting issues for Prisma core team.                                                                                                                                                              |
| **`prisma-next-extension-upgrade`**             | Upgrading custom Prisma Next extensions.                                                    | Used only if developing custom Prisma Next extensions.                                                                                                                                               |
| **`prisma-cli`**                                | General Prisma CLI commands (`prisma studio`, `prisma db`).                                 | Reference for CLI utility commands (e.g. launching Prisma Studio).                                                                                                                                   |
| **`prisma-client-api`**                         | Legacy/standard Prisma Client query reference.                                              | Useful reference for comparison when translating standard Prisma queries.                                                                                                                            |
| **`prisma-database-setup`**                     | Configuring database connections and environment variables.                                 | Reference for Postgres connection URL formatting and SSL params.                                                                                                                                     |
| **`prisma-postgres` & `prisma-postgres-setup`** | Prisma Postgres platform setup.                                                             | Guidance if provisioning managed Prisma Postgres instances.                                                                                                                                          |
| **`prisma-compute`**                            | Prisma Compute serverless deployment.                                                       | Deployment guide for Prisma Compute runtime targets.                                                                                                                                                 |
| **`prisma-driver-adapter-implementation`**      | SQL driver adapter internals.                                                               | Reference for driver adapter error preservation and transactions.                                                                                                                                    |
| **`prisma-upgrade-v7`**                         | Migration guide from Prisma ORM v6 to v7.                                                   | Reference when handling breaking changes from older Prisma versions.                                                                                                                                 |

---

### 3.2 Observability & Monitoring Skills (Sentry)

The application has Sentry deeply integrated across client, server, and edge runtimes (`@sentry/nextjs: ^10.73.0`).

| Skill                                                           | Trigger / When to Use                                                                                       | Key Instructions                                                                                                                                                       |
| :-------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`sentry-nextjs-sdk`**                                         | Adding or configuring Sentry in Next.js 16 App Router, Server Actions, Route Handlers, or error boundaries. | Consult for proper Next.js App Router instrumentation (`src/instrumentation.ts`, `src/instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`). |
| **`sentry-instrument`**                                         | Adding custom spans, tracing, profiling, session replay, or cron monitors.                                  | Primary playbook for instrumenting application features with Sentry signals.                                                                                           |
| **`sentry-instrumentation-guide`**                              | Deciding whether a signal should be an Error, Span, Span Attribute, Log, or Metric.                         | Read this before adding ad-hoc logs or error captures to ensure high-signal telemetry.                                                                                 |
| **`sentry-instrument-logging`**                                 | Emitting structured logs that connect with Sentry traces.                                                   | Guidelines for structured logging without polluting telemetry.                                                                                                         |
| **`sentry-setup-ai-monitoring`**                                | Tracing AI model invocations, token usage, latency, and agent loops.                                        | Instruments Vercel AI SDK (`ai`), OpenAI, Anthropic, and Google GenAI calls with Sentry AI monitoring.                                                                 |
| **`sentry-debug-issue` & `sentry-fix-issues`**                  | Investigating and debugging errors reported in production or Sentry dashboards.                             | Methodically pulls stack traces, breadcrumbs, and context to identify root causes and write verified fixes.                                                            |
| **`sentry-fix-stack-traces`**                                   | Resolving minified or unreadable stack traces.                                                              | Verifies source map uploads and configuration in `next.config.ts`.                                                                                                     |
| **`sentry-setup-releases`**                                     | Configuring release health, deploy tracking, and suspect commits.                                           | Sets release versions in CI/CD pipeline.                                                                                                                               |
| **`sentry-create-alert`**                                       | Configuring alert rules, notification thresholds, and workflow automations.                                 | Creates alerts for Slack, Discord, email, or PagerDuty.                                                                                                                |
| **`sentry-pr-code-review`**                                     | Reviewing automated Seer Bug Prediction comments on PRs.                                                    | Triage and fix issues surfaced during PR review.                                                                                                                       |
| **`sentry-sdk-setup` & `sentry-get-started`**                   | Routing and baseline Sentry verification.                                                                   | Entry points for general Sentry capabilities.                                                                                                                          |
| **`sentry-sdk-upgrade`**                                        | Upgrading `@sentry/nextjs` across major releases.                                                           | Resolves deprecated APIs and config updates.                                                                                                                           |
| **`sentry-node-sdk`, `sentry-react-sdk`, `sentry-browser-sdk`** | Sub-environment SDK references.                                                                             | Detailed APIs for Node runtime, React hooks, or browser scripts.                                                                                                       |
| **`sentry-otel-exporter-setup`**                                | OpenTelemetry Collector integration.                                                                        | Configures OTel pipelines to export to Sentry.                                                                                                                         |

---

### 3.3 Visual Workflow Canvas Skills (React Flow)

| Skill            | Trigger / When to Use                                                                                                                                                                    | Key Instructions                                                                                                                                                                                                   |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`react-flow`** | Building, editing, or styling workflow graph components in `src/features/editor/`. Adding custom nodes, handles, custom edges, drag-and-drop node placement, or canvas viewport control. | Use `@xyflow/react` conventions. Implement custom nodes using `Handle` (with explicit `type="target"` and `type="source"`), type props with `NodeProps`, and manage viewport via `useReactFlow()` and `fitView()`. |

---

### 3.4 AI & LLM Skills (Vercel AI SDK v7)

The project uses Vercel AI SDK v7 (`ai: ^7.0.85`) alongside provider packages `@ai-sdk/openai`, `@ai-sdk/anthropic`, and `@ai-sdk/google`.

| Skill                         | Trigger / When to Use                                                                                         | Key Instructions                                                                                                                                    |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ai-sdk`**                  | Implementing AI node executors, text generation, streaming, tool calling, structured outputs, or agent loops. | Use `generateText`, `streamText`, `ToolLoopAgent`, and Zod schemas for structured output. Pair with `src/features/executions/` executor interfaces. |
| **`migrate-ai-sdk-v6-to-v7`** | Writing or refactoring AI SDK code to adhere to v7 breaking changes.                                          | **Crucial v7 changes**: `system` parameter renamed to `instructions`, use of `fullStream`, new tool context signatures, and `finalStep` handling.   |

---

### 3.5 UI & Styling Skills (shadcn/ui & Radix)

| Skill                       | Trigger / When to Use                                                                       | Key Instructions                                                                                                                           |
| :-------------------------- | :------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **`shadcn`**                | Adding, configuring, or styling UI components (buttons, dialogs, inputs, dropdowns, forms). | Follow `components.json` configuration. Place components in `src/components/ui/`. Ensure compatibility with Tailwind CSS v4 CSS variables. |
| **`migrate-radix-to-base`** | Refactoring or migrating Radix UI primitives to Base UI.                                    | Reference if replacing underlying headless primitives.                                                                                     |

---

## 4. Coding Standards & Architectural Conventions

### 4.1 Prisma Types Reuse & Database Workflow

> [!IMPORTANT]
> **Always reuse Prisma-generated types instead of creating manual type definitions.**
> Do NOT declare custom interfaces or types for entities that exist in the database schema.
> Only define custom types in **worst-case scenarios** where a Prisma type is unavailable (e.g. transient client-only UI interaction state, unpersisted canvas drag state, or unmodeled third-party API payloads).

- **Import generated contract types** directly from `@/prisma/contract.d`:
  ```typescript
  import type { FieldOutputTypes } from "@/prisma/contract.d"

  // Always derive model types from the emitted contract:
  type Node = FieldOutputTypes["public"]["Node"]
  type Connection = FieldOutputTypes["public"]["Connection"]
  type Workflow = FieldOutputTypes["public"]["Workflow"]
  type Execution = FieldOutputTypes["public"]["Execution"]
  ```
- **Database Changes Workflow**:
  1. **Never edit `contract.json` or `contract.d.ts` directly.**
  2. Open `src/prisma/contract.prisma` and make changes to models, attributes, or relations.
  3. Run `npm run contract:emit` (or `npx prisma contract emit`).
  4. Import `db` from `@/prisma/db` and access your models via `db.orm.public.<Model>`.
  5. Run `npm run typecheck` to verify complete type safety.

### 4.2 Codebase-First Bug Fixing (Token Efficiency & Context Reuse)

- **Inspect neighboring/sibling code first**: When debugging or fixing issues, check existing implementations in the codebase before performing wide-ranging exploratory searches or spending tokens on extensive codebase analysis.
- **Reference existing patterns**:
  - For node execution logic, consult existing executors (e.g. [`src/features/executions/components/http-request/executor.ts`](file:///Users/blagare/Desktop/Next%20JS%20Learning/nextjs16-n8n/src/features/executions/components/http-request/executor.ts) or [`src/features/triggers/components/manual-trigger/executor.ts`](file:///Users/blagare/Desktop/Next%20JS%20Learning/nextjs16-n8n/src/features/triggers/components/manual-trigger/executor.ts)).
  - For Inngest step execution and DAG topological ordering, inspect [`src/inngest/functions.ts`](file:///Users/blagare/Desktop/Next%20JS%20Learning/nextjs16-n8n/src/inngest/functions.ts) and [`src/inngest/utils.ts`](file:///Users/blagare/Desktop/Next%20JS%20Learning/nextjs16-n8n/src/inngest/utils.ts).
  - For editor canvas state, inspect [`src/features/editor/`](file:///Users/blagare/Desktop/Next%20JS%20Learning/nextjs16-n8n/src/features/editor/).
- **Targeted edits**: Pinpoint the exact failing file and apply surgical, high-confidence fixes matching established project patterns.

### 4.3 Strict TypeScript Type Safety

- **100% Strict Type Safety**: This is a strict TypeScript project. Every variable, function parameter, return type, component prop, tRPC procedure, and Inngest payload MUST have proper, explicit type safety.
- **No `any`**: Avoid `any`, loose `Record<string, any>`, or unchecked type assertions (`as unknown as ...` unless required for runtime global singletons).
- **Zod Schemas**: Use Zod for runtime input validation and infer TypeScript types directly via `z.infer<typeof schema>`.
- Run `npm run typecheck` (`tsc --noEmit`) to ensure zero compiler errors.

### 4.4 ESLint & Prettier Compliance

- **Strict adherence to ESLint and Prettier rules**: All code must comply with the project's ESLint configuration (including `simple-import-sort`, `next/core-web-vitals`, unused vars checks) and Prettier configuration (`.prettierrc`, Tailwind CSS class sorting).
- **Automated formatting & fixing**:
  - Run `npm run lint:fix` to automatically resolve lint errors.
  - Run `npm run format` to ensure clean code formatting.
  - Verify formatting and linting pass cleanly without warnings before completing any task.

### 4.5 Workflow Execution Architecture

- **Canvas Nodes & Edges**: Defined in `src/features/editor/`. Workflows are saved as node graphs with connection edges.
- **Executor Registry**: Located in `src/features/executions/lib/executor-registry.ts`. Every execution node type (e.g. `http-request`, AI models) registers an executor adhering to the standard executor interface.
- **Async Execution with Inngest**: Inngest functions in `src/inngest/functions.ts` execute workflow runs in the background. Long-running tasks, retries, and rate limits are managed via Inngest steps.

### 4.6 Next.js 16 & React 19 Conventions

- In Next.js 16, dynamic route parameters and search params are asynchronous:
  ```typescript
  // Next.js 16 App Router Page
  export default async function Page({
    params,
    searchParams,
  }: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }) {
    const { id } = await params
    // ...
  }
  ```
- Always consult `node_modules/next/dist/docs/` when in doubt about App Router conventions, caching behavior, or Server Action rules.

### 4.7 Quality Checks Before Committing

Always verify changes with the following suite:

```bash
npm run format:check && npm run lint && npm run typecheck
```

If schema changes were made, ensure `npm run contract:emit` was executed and generated files are in sync.
