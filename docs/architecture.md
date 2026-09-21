# System Architecture & Node Pipeline

## Project Overview

nextjs16-n8n is a visual workflow automation platform (inspired by n8n) built with Next.js 16, React 19, and an event-driven architecture. Users design workflows as node graphs on a canvas, connect them with edges, and execute them as durable background jobs.

---

## Technology Stack

| Layer                | Technology                                                                       | Purpose                                          |
| :------------------- | :------------------------------------------------------------------------------- | :----------------------------------------------- |
| **Framework**        | Next.js 16 (App Router) · React 19 · TypeScript (strict)                         | Application framework, routing, and UI rendering |
| **Styling**          | Tailwind CSS v4 (`@tailwindcss/postcss`, `tw-animate-css`) · shadcn/ui · Radix   | Design system and primitives                     |
| **Workflow Canvas**  | React Flow (`@xyflow/react`)                                                     | Interactive drag-and-drop node graph canvas      |
| **Database & ORM**   | Prisma Next / Prisma ORM 8 (`@prisma/orm-postgres`) · PostgreSQL                 | Data persistence with contract-driven ORM        |
| **Background Jobs**  | Inngest v4 (`inngest`, `inngest-cli`)                                            | Durable execution engine & event orchestration   |
| **API & Data**       | tRPC v11 · TanStack React Query v5                                               | End-to-end type-safe client-server communication |
| **Auth & Billing**   | Better Auth · Polar (`@polar-sh/better-auth`, `@polar-sh/sdk`)                   | User authentication, sessions, and subscriptions |
| **AI / LLM**         | Vercel AI SDK v7 (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`) | Multi-provider AI integrations                   |
| **Observability**    | Sentry (`@sentry/nextjs`)                                                        | Errors, distributed tracing, and session replay  |
| **State Management** | Jotai (atomic state) · nuqs (URL search params)                                  | Component and URL query parameter state          |
| **Forms**            | React Hook Form + `@hookform/resolvers` + Zod v4                                 | Form validation and typed schemas                |

---

## Directory Structure

```
nextjs16-n8n/
├── docs/                            # Modular architecture & conventions docs
├── src/
│   ├── app/                         # Next.js 16 App Router
│   │   ├── (auth)/                  # Auth pages (sign-in, sign-up)
│   │   ├── (dashboard)/             # Dashboard & workflow management
│   │   ├── api/inngest/             # Inngest serve handler
│   │   ├── api/trpc/                # tRPC HTTP handler
│   │   ├── globals.css              # Tailwind v4 theme & CSS variables
│   │   └── layout.tsx               # Root layout
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # shadcn/ui primitives
│   │   ├── react-flow/              # React Flow custom components
│   │   ├── node-selector.tsx        # Workflow node picker
│   │   ├── workflow-node.tsx        # Node rendering component
│   │   └── app-sidebar.tsx          # Dashboard sidebar
│   ├── config/                      # App constants & node component registry
│   ├── features/                    # Domain-driven feature modules
│   │   ├── auth/                    # Authentication & user sessions
│   │   ├── credentials/             # Credential management (encrypted)
│   │   ├── editor/                  # Workflow editor & React Flow canvas
│   │   ├── executions/              # Execution engine & node executors
│   │   ├── subscriptions/           # Polar billing & subscriptions
│   │   ├── triggers/                # Trigger nodes (manual, webhooks)
│   │   └── workflows/               # Workflow CRUD & graph resolution
│   ├── hooks/                       # Custom React hooks
│   ├── inngest/                     # Inngest client, events & functions
│   │   ├── client.ts                # Inngest client instance
│   │   ├── functions.ts             # Durable function definitions
│   │   ├── utils.ts                 # DAG topological sort utilities
│   │   └── channels/               # Realtime channels
│   ├── lib/                         # Shared utilities
│   │   ├── auth.ts                  # Better Auth server config
│   │   ├── auth-client.ts           # Better Auth client
│   │   ├── encryption.ts            # Cryptr encryption helpers
│   │   ├── pagination.ts            # Cursor pagination utilities
│   │   ├── polar.ts                 # Polar SDK config
│   │   └── utils.ts                 # cn() and general helpers
│   ├── prisma/                      # Database contract & client
│   │   ├── contract.prisma          # ⭐ Source of truth data contract
│   │   ├── contract.json            # Generated — DO NOT EDIT
│   │   ├── contract.d.ts            # Generated — DO NOT EDIT
│   │   └── db.ts                    # Runtime client (db.orm.public.*)
│   ├── trpc/                        # tRPC router definitions & context
│   │   ├── init.ts                  # tRPC initialization & middleware
│   │   ├── routers/                 # Feature-specific routers
│   │   ├── client.tsx               # Client-side tRPC provider
│   │   ├── server.tsx               # Server-side tRPC caller
│   │   └── query-client.ts          # TanStack Query client config
│   ├── instrumentation.ts           # Sentry server/edge instrumentation
│   └── instrumentation-client.ts    # Sentry client instrumentation
├── migrations/                      # Prisma Next database migrations
├── prisma.config.ts                 # Prisma CLI configuration
├── sentry.server.config.ts          # Sentry server config
├── sentry.edge.config.ts            # Sentry edge config
├── mprocs.yaml                      # Dev process manager (Next + Inngest + ngrok)
├── components.json                  # shadcn/ui configuration
└── .agents/skills/                  # Agent skills (auto-discovered)
```

---

## Workflow Execution Pipeline

Workflows follow a 5-stage lifecycle from canvas design to real-time execution:

```
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐     ┌───────────────────┐     ┌──────────────┐
│ 1. Canvas    │ ──> │ 2. Persist   │ ──> │ 3. Executor       │ ──> │ 4. Inngest Engine │ ──> │ 5. Realtime  │
│ (React Flow) │     │ (tRPC + DB)  │     │    Registry       │     │    (DAG Sort)     │     │ (Streaming)  │
└──────────────┘     └──────────────┘     └───────────────────┘     └───────────────────┘     └──────────────┘
```

1. **Canvas (`src/features/editor/`)**: Users compose workflows as node graphs using `@xyflow/react`. Nodes represent triggers or actions, connected via directed edges.
2. **Persistence (`src/features/workflows/`)**: Workflows, nodes, and connections are serialized and stored via tRPC routers into PostgreSQL through Prisma Next.
3. **Executor Registry (`src/features/executions/lib/executor-registry.ts`)**: Each node type implements a standard executor interface defining input validation, credential resolution, and execution logic.
4. **Inngest Functions (`src/inngest/functions.ts`)**: Workflow runs are scheduled as durable Inngest background jobs. Execution order is determined using topological DAG sorting (`src/inngest/utils.ts`).
5. **Realtime Updates (`src/inngest/channels/`)**: Execution status, node run states, logs, and outputs are published to native Inngest realtime channels and streamed live to the UI.

---

## Adding a New Node Type

Follow these steps to add a new workflow node type:

1. **Create the Node Component**:
   Create the UI and settings panel under:
   `src/features/executions/components/<node-type>/`
   Include:
   - Node canvas display component (with `<Handle />` connections).
   - Node config / parameter editing panel.

2. **Implement the Executor**:
   Create `executor.ts` in the node directory implementing the standard executor interface:
   - Reference existing executors: `src/features/executions/components/http-request/executor.ts` or `src/features/executions/components/manual-trigger/executor.ts`.
   - Validate node parameters with Zod.
   - Return typed outputs or throw structured execution errors.

3. **Register in Executor Registry**:
   Add the node's executor to `src/features/executions/lib/executor-registry.ts`.

4. **Register in Node Components**:
   Register the node definition, metadata, icon, and default properties in `src/config/node-components.ts`.
