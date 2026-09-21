<!-- prettier-ignore -->
<div align="center">

<img src="./public/logos/logo.svg" alt="Nodemation Logo" height="60" />

# Nodemation

**Next-Generation Visual Workflow Automation Engine**

An open-source, event-driven workflow automation platform inspired by n8n.  
Design complex node graphs on an infinite canvas and execute them as fault-tolerant, durable background workflows.

[![Production App](https://img.shields.io/badge/Live_App-nextjs16--n8n.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://nextjs16-n8n.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/BhushanLagare7/nextjs16-n8n)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Prisma Next](https://img.shields.io/badge/Prisma_Next-ORM_8-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Inngest v4](https://img.shields.io/badge/Inngest-v4_Durable-7B38FC?style=for-the-badge&logo=inngest&logoColor=white)](https://www.inngest.com/)
[![React Flow](https://img.shields.io/badge/React_Flow-xyflow-FF0072?style=for-the-badge&logo=reactflow&logoColor=white)](https://reactflow.dev/)
[![tRPC v11](https://img.shields.io/badge/tRPC-v11_TypeSafe-2596BE?style=for-the-badge&logo=trpc&logoColor=white)](https://trpc.io/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<br />

[Live Demo](https://nextjs16-n8n.vercel.app) • [Key Features](#key-features) • [Architecture](#system-architecture) • [Node Ecosystem](#node-ecosystem) • [Execution Pipeline](#workflow-execution-pipeline) • [Quick Start](#quick-start) • [Dev Reference](#development-scripts) • [Documentation](#documentation)

<br />

<a href="https://nextjs16-n8n.vercel.app" target="_blank" rel="noopener noreferrer">
  <img src="./public/og-image.png" alt="Nodemation — Visual Workflow Automation Banner" width="100%" />
</a>

</div>

---

> [!TIP]
> **Live Production Deployment**: Experience Nodemation online at **[https://nextjs16-n8n.vercel.app](https://nextjs16-n8n.vercel.app)**.  
> **One-Command Local Orchestration**: Spin up Next.js 16, the Inngest local executor UI, and an ngrok webhook tunnel concurrently with a single command: `npm run dev:all`.

---

<a id="key-features"></a>

## ✨ Key Features

| Capability                            | Highlights                                                                                                        | Benefit                                                                                                      |
| :------------------------------------ | :---------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **🎨 Interactive Visual Canvas**      | Infinite pan/zoom canvas powered by `@xyflow/react` with custom handles and dynamic node connection validation.   | Drag, drop, connect, and inspect complex automation DAGs with immediate visual feedback.                     |
| **⚡ Durable Execution Engine**       | Background pipeline powered by Inngest v4 with automatic step memoization, exponential retries, and sleep delays. | Workflows survive server crashes, external API outages, and network interruptions without losing progress.   |
| **🧠 Multi-Model AI Orchestration**   | Native integrations with OpenAI (GPT-4o), Anthropic (Claude 3.5), and Google (Gemini) via Vercel AI SDK v7.       | Build intelligent workflows with prompt chaining, structured JSON outputs, and agentic transformations.      |
| **🔒 Enterprise Credential Vault**    | Zero-leakage credential isolation encrypted at rest with Cryptr AES-256 before storage in PostgreSQL.             | Store API tokens and OAuth secrets securely without exposing keys to clients or execution logs.              |
| **📊 DAG Topological Sorting**        | Automated dependency resolution and graph cycle detection using topological sorting (`toposort`).                 | Ensures nodes execute in strict dependency order, passing typed upstream outputs into downstream inputs.     |
| **📡 Realtime Streaming & Telemetry** | Server-Sent Events and typed Inngest realtime channels broadcasting live execution state to canvas nodes.         | Watch nodes illuminate in real time as steps run, complete, or report errors right inside the visual editor. |

---

<a id="system-architecture"></a>

## 🏛️ System Architecture

The platform bridges reactive canvas design with resilient asynchronous background execution:

```
┌───────────────────────────────┐
│       Interactive Canvas      │  React 19 + @xyflow/react
│   (Drag & Drop Workflow DAG)  │  Jotai atomic state + nuqs URL params
└───────────────┬───────────────┘
                │ Save / Trigger (Type-safe Mutation)
                ▼
┌───────────────────────────────┐
│          tRPC Server          │  tRPC v11 Router
│    (Validation & Auth Gate)   │  Better Auth session verification + Zod
└───────────────┬───────────────┘
                │ Persist Graph State & Credentials
                ▼
┌───────────────────────────────┐
│     PostgreSQL + Prisma Next  │  Prisma ORM 8 (@prisma/orm-postgres)
│  (Data Contract Source of Truth)│  Single contract: src/prisma/contract.prisma
└───────────────┬───────────────┘
                │ Trigger Durable Execution Job
                ▼
┌───────────────────────────────┐
│      Inngest Engine (v4)      │  Topological DAG Resolution (toposort)
│  (Crash-Proof Step Execution) │  Per-node executor isolation + memoized steps
└───────────────┬───────────────┘
                │ Live Status & Logs
                ▼
┌───────────────────────────────┐
│   Realtime Channel Streaming  │  Native Inngest Realtime Channels
│   (Live Canvas State Updates) │  Instant visual execution progress in browser
└───────────────────────────────┘
```

---

<a id="node-ecosystem"></a>

## 🧩 Node Ecosystem

Workflows are built from modular trigger and action nodes. Each node features isolated schema validation, credential binding, and execution logic:

### ⚡ Triggers (Workflow Starters)

| Trigger Node            |                                         Icon                                          | Type                  | Capabilities                                                                                              |
| :---------------------- | :-----------------------------------------------------------------------------------: | :-------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Manual Trigger**      |                                         ⚡ 🖱️                                         | `MANUAL_TRIGGER`      | Instant, on-demand execution trigger with custom test payloads directly from the canvas.                  |
| **Google Form Trigger** | <img src="./public/logos/googleform.svg" width="20" height="20" alt="Google Forms" /> | `GOOGLE_FORM_TRIGGER` | Captures external form submissions, unpacks dynamic form responses, and routes answers down the pipeline. |
| **Stripe Webhook**      |      <img src="./public/logos/stripe.svg" width="20" height="20" alt="Stripe" />      | `STRIPE_TRIGGER`      | Listens for Stripe webhook events (`checkout.session.completed`, `invoice.paid`, customer updates).       |

### 🤖 AI & LLM Nodes

| Model Provider    |                                        Icon                                        | Type        | Model Support & Capabilities                                                                            |
| :---------------- | :--------------------------------------------------------------------------------: | :---------- | :------------------------------------------------------------------------------------------------------ |
| **OpenAI**        |    <img src="./public/logos/openai.svg" width="20" height="20" alt="OpenAI" />     | `OPENAI`    | Supports `gpt-4o`, `gpt-4o-mini`, and reasoning models with structured output parsing and token limits. |
| **Anthropic**     | <img src="./public/logos/anthropic.svg" width="20" height="20" alt="Anthropic" />  | `ANTHROPIC` | Powered by Claude 3.5 Sonnet and Haiku for deep document comprehension and complex prompt chains.       |
| **Google Gemini** | <img src="./public/logos/gemini.svg" width="20" height="20" alt="Google Gemini" /> | `GEMINI`    | Multimodal reasoning with Gemini 1.5 Pro and Flash with massive context window capabilities.            |

### 🌐 Integrations & Actions

| Action Node      |                                     Icon                                      | Type           | Capabilities                                                                                                               |
| :--------------- | :---------------------------------------------------------------------------: | :------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Request** |                                      🌐                                       | `HTTP_REQUEST` | Universal REST client supporting `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, custom headers, query params, and JSON payloads. |
| **Slack**        |   <img src="./public/logos/slack.svg" width="20" height="20" alt="Slack" />   | `SLACK`        | Sends channel notifications, automated alerts, and formatted messages via incoming webhooks or bot tokens.                 |
| **Discord**      | <img src="./public/logos/discord.svg" width="20" height="20" alt="Discord" /> | `DISCORD`      | Dispatches rich embeds, alerts, and notifications to Discord servers via webhooks.                                         |

---

<a id="workflow-execution-pipeline"></a>

## 🔄 Workflow Execution Pipeline

When a workflow runs, it proceeds through five resilient phases:

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────┐
│  1. Canvas  │ ──> │ 2. Persist  │ ──> │ 3. DAG Toposort  │ ──> │ 4. Inngest Run  │ ──> │ 5. Realtime │
│ (ReactFlow) │     │ (Postgres)  │     │   (Resolution)   │     │ (Durable Steps) │     │ (Live Sync) │
└─────────────┘     └─────────────┘     └──────────────────┘     └─────────────────┘     └─────────────┘
```

1. **Canvas Interaction**: Nodes and edges are created or modified on the `@xyflow/react` surface and verified for valid ports.
2. **Atomic Persistence**: The graph structure, node configurations, and connections are committed via tRPC into PostgreSQL.
3. **Topological Ordering**: The graph resolver runs a cycle-safe topological sort to schedule nodes strictly by upstream dependency.
4. **Durable Execution**: Inngest executes each node in a separate `step.run()` block. If any step fails, Inngest retries that specific step without re-executing completed ones.
5. **Realtime Broadcast**: Step progress, runtime variables, and logs are pushed to realtime event channels, illuminating active nodes on the canvas.

---

<a id="technology-matrix"></a>

## 🛠️ Technology Matrix

| Category           | Technology                                                                        |          Version           | Purpose                                                          |
| :----------------- | :-------------------------------------------------------------------------------- | :------------------------: | :--------------------------------------------------------------- |
| **Core Framework** | [Next.js](https://nextjs.org/)                                                    |          `16.3.3`          | App Router, Server Components, Route Handlers, Async Params      |
| **UI Library**     | [React](https://react.dev/)                                                       |          `19.2.8`          | Concurrent features, React Compiler memoization, Server Actions  |
| **Canvas Engine**  | [React Flow (@xyflow/react)](https://reactflow.dev/)                              |         `12.11.6`          | Interactive workflow canvas, draggable nodes, edge routing       |
| **Durable Engine** | [Inngest](https://www.inngest.com/)                                               |         `v4.18.1`          | Fault-tolerant workflow scheduling, step memoization, retries    |
| **Database & ORM** | [Prisma Next](https://www.prisma.io/)                                             | `@prisma/orm-postgres 8.0` | Contract-driven ORM, type-safe queries (`db.orm.public.*`)       |
| **API Layer**      | [tRPC](https://trpc.io/) + [TanStack Query](https://tanstack.com/query)           |        `v11` / `v5`        | End-to-end typed client-server RPC with caching and invalidation |
| **AI Framework**   | [Vercel AI SDK](https://sdk.vercel.ai/)                                           |         `v7.0.85`          | Universal AI integration for OpenAI, Anthropic, and Google       |
| **Authentication** | [Better Auth](https://www.better-auth.com/)                                       |          `1.7.2`           | Session management, GitHub & Google OAuth providers              |
| **Billing**        | [Polar](https://polar.sh/)                                                        |          `0.47.1`          | Subscription tiers, checkout redirects, customer portal          |
| **Styling**        | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |           `v4.0`           | Modern CSS theme variables, accessible Radix UI primitives       |
| **Observability**  | [Sentry](https://sentry.io/)                                                      |         `v10.73.0`         | Distributed tracing, error capture, and performance monitoring   |

---

<a id="quick-start"></a>

## 🚀 Quick Start

### Prerequisites

- **Node.js**: `>= 20.0.0`
- **PostgreSQL**: `>= 15.0` (Local instance, Docker, or [Neon](https://neon.tech))
- **Package Manager**: `npm` (or `pnpm`)

### 1. Clone & Install

```bash
git clone https://github.com/BhushanLagare7/nextjs16-n8n.git
cd nextjs16-n8n
npm install
```

### 2. Configure Environment

Copy the `.env.example` template to `.env` and configure your credentials:

```bash
cp .env.example .env
```

Key environment configurations:

```dotenv
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Better Auth & Security
BETTER_AUTH_SECRET="your-32-character-secret"
BETTER_AUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="your-aes-encryption-key"

# Inngest Background Runner
INNGEST_DEV=1

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NGROK_URL="https://your-ngrok-tunnel.ngrok-free.app"
```

### 3. Emit Prisma Contract Types

> [!IMPORTANT]
> This project uses **Prisma Next** (`@prisma/orm-postgres`). There is **no** `schema.prisma` and **no** `prisma generate`. The single source of truth is `src/prisma/contract.prisma`.

Generate the TypeScript types and contract artifacts:

```bash
npm run contract:emit
```

### 4. Launch Development Environment

Run Next.js, the local Inngest Dev Server, and ngrok concurrently:

```bash
npm run dev:all
```

| Service             | Local URL                                      | Description                                                |
| :------------------ | :--------------------------------------------- | :--------------------------------------------------------- |
| **Web Application** | [http://localhost:3000](http://localhost:3000) | Main dashboard, workflow editor, and canvas                |
| **Inngest Dev UI**  | [http://localhost:8288](http://localhost:8288) | Background job visualizer, step debugger, and event log    |
| **ngrok Tunnel**    | Output in `mprocs` terminal                    | Public tunnel for external webhooks (Google Forms, Stripe) |

---

<a id="development-scripts"></a>

## 💻 Development Scripts

| Command                 | Action                                                                        |
| :---------------------- | :---------------------------------------------------------------------------- |
| `npm run dev:all`       | Runs Next.js, Inngest Dev Server, and ngrok concurrently via `mprocs`         |
| `npm run dev`           | Launches only the Next.js 16 App Router dev server                            |
| `npm run inngest:dev`   | Launches the local Inngest development server and UI                          |
| `npm run ngrok:dev`     | Starts the ngrok tunnel bound to `NGROK_URL` for local webhooks               |
| `npm run contract:emit` | Compiles `src/prisma/contract.prisma` into `contract.d.ts` & `contract.json`  |
| `npm run build`         | Builds the production Next.js application bundle                              |
| `npm run start`         | Serves the optimized production build                                         |
| `npm run test`          | Executes unit tests with Node test runner via `tsx --test 'src/**/*.test.ts'` |
| `npm run typecheck`     | Validates strict TypeScript compilation via `tsc --noEmit`                    |
| `npm run lint`          | Runs ESLint validation across the repository                                  |
| `npm run lint:fix`      | Automatically fixes auto-resolvable ESLint issues                             |
| `npm run format`        | Auto-formats code with Prettier and sorts imports                             |
| `npm run format:check`  | Verifies code formatting conformance without writing changes                  |

---

<a id="project-structure"></a>

## 📂 Project Structure

```
nextjs16-n8n/
├── docs/                        # Modular architecture & convention guides
│   ├── architecture.md          # Tech stack & node execution lifecycle
│   ├── database-conventions.md  # Prisma Next contract rules & queries
│   ├── inngest-conventions.md   # Durable function & step patterns
│   └── development-workflow.md  # Local servers, mprocs & scripts
├── public/
│   ├── logos/                   # SVG logos for node integrations
│   │   └── logo.svg             # Project brand mark
│   └── og-image.png             # Project banner & social preview image
├── src/
│   ├── app/                     # Next.js 16 App Router pages & APIs
│   │   ├── (auth)/              # Sign-in & sign-up routes
│   │   ├── (dashboard)/         # Workflow manager & canvas editor routes
│   │   └── api/                 # Inngest serve & tRPC HTTP handlers
│   ├── components/              # Reusable UI primitives & React Flow wrappers
│   ├── config/                  # Node registry & system constants
│   ├── features/                # Domain modules (editor, executions, triggers, auth)
│   │   ├── editor/              # Graph canvas, state syncing, node drawer
│   │   ├── executions/          # Node executors (OpenAI, Anthropic, Gemini, HTTP, etc.)
│   │   ├── triggers/            # Trigger executors (Manual, Google Form, Stripe)
│   │   └── credentials/         # Encrypted credential manager
│   ├── inngest/                 # Inngest client, durable functions, and DAG utils
│   ├── lib/                     # Auth, Cryptr encryption, and Polar helpers
│   ├── prisma/                  # Prisma Next contract and runtime client
│   │   ├── contract.prisma      # ⭐ Single source of truth data contract
│   │   └── db.ts                # Type-safe client (db.orm.public.*)
│   └── trpc/                    # tRPC router definitions & TanStack Query client
└── mprocs.yaml                  # Concurrent multi-process runner configuration
```

---

<a id="documentation"></a>

## 📖 Documentation

Dive deeper into the modular technical documentation:

| Document                                                        | Focus Area                                                                                    |
| :-------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| 📐 [Architecture & Pipeline](docs/architecture.md)              | Deep-dive into the 5-stage execution pipeline and step-by-step guide for adding new nodes.    |
| 🛠️ [Development Workflow](docs/development-workflow.md)         | Environment setup, process orchestration (`mprocs`), ngrok tunneling, and CLI tooling.        |
| 🗄️ [Database Conventions](docs/database-conventions.md)         | Working with Prisma Next contracts, schema modifications, and `@prisma/orm-postgres` queries. |
| ⚡ [Inngest Background Jobs](docs/inngest-conventions.md)       | Durable execution rules, `step.run()` encapsulation, DAG sorting, and realtime streaming.     |
| ⚛️ [Next.js 16 & React 19](docs/nextjs-react-conventions.md)    | Async dynamic route params, React Compiler compatibility, and React Hook Form best practices. |
| 📏 [Code Conventions](docs/code-conventions.md)                 | Import sorting, Prettier rules, TypeScript strict typing, and Zod v4 validation patterns.     |
| 🔍 [Observability & Debugging](docs/observability-debugging.md) | Sentry runtime configurations, error boundaries, and workflow troubleshooting.                |
| 🧪 [Testing Conventions](docs/testing-conventions.md)           | Test runner setup with `tsx --test`, executor test mocks, and unit testing guidelines.        |

---

<div align="center">
  <sub>Built with Next.js 16, React 19, Inngest v4, and Prisma Next. Deployed at <a href="https://nextjs16-n8n.vercel.app">nextjs16-n8n.vercel.app</a>.</sub>
</div>
