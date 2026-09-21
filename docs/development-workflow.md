# Development Workflow & Setup

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and configure local credentials:

```bash
cp .env.example .env
```

#### Critical Environment Variables

| Variable                                    | Description                                              |
| :------------------------------------------ | :------------------------------------------------------- |
| `DATABASE_URL`                              | PostgreSQL connection string (must be PostgreSQL >= v15) |
| `BETTER_AUTH_SECRET`                        | Secret key for Better Auth session signing               |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth application credentials                     |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials                                 |
| `INNGEST_DEV`                               | Set to `1` to enable Inngest local dev mode              |
| `ENCRYPTION_KEY`                            | AES encryption key for credential encryption via Cryptr  |
| `NEXT_PUBLIC_APP_URL`                       | Public application URL (e.g. `http://localhost:3000`)    |
| `NGROK_URL`                                 | Optional ngrok URL for tunneling local webhooks          |

### 3. Generate Prisma Contract Types

Generate TypeScript types and JSON contracts from `contract.prisma`:

```bash
npm run contract:emit
```

---

## Running Development Services

You can run all services concurrently using `mprocs`, or launch them in separate terminal windows:

### Option A: All Services Concurrently (Recommended)

Runs Next.js, Inngest Dev Server, and ngrok concurrently:

```bash
npm run dev:all
```

### Option B: Individual Services

```bash
# 1. Next.js dev server on http://localhost:3000
npm run dev

# 2. Inngest local dev server UI on http://localhost:8288
npm run inngest:dev

# 3. ngrok tunnel for webhook triggers (requires NGROK_URL in .env)
npm run ngrok:dev
```

---

## Development Scripts Reference

| Command                 | Description                                                    |
| :---------------------- | :------------------------------------------------------------- |
| `npm run dev`           | Start Next.js development server                               |
| `npm run inngest:dev`   | Start local Inngest development server                         |
| `npm run dev:all`       | Run Next.js, Inngest, and ngrok via `mprocs`                   |
| `npm run build`         | Build production Next.js application bundle                    |
| `npm run start`         | Start production Next.js server                                |
| `npm run contract:emit` | Regenerate Prisma Next types from `src/prisma/contract.prisma` |
| `npm run typecheck`     | Run TypeScript typecheck with `tsc --noEmit`                   |
| `npm run lint`          | Run ESLint check                                               |
| `npm run lint:fix`      | Automatically fix ESLint issues                                |
| `npm run format`        | Auto-format codebase with Prettier and ESLint                  |
| `npm run format:check`  | Check code formatting without modifying files                  |
| `npm run test`          | Run TSX unit tests (`tsx --test 'src/**/*.test.ts'`)           |

---

## Pre-Commit Quality Checks

Always run this verification suite before committing or completing tasks:

```bash
npm run format:check && npm run lint && npm run typecheck
```

If schema modifications were made to `src/prisma/contract.prisma`, run `npm run contract:emit` first to ensure generated files (`contract.json`, `contract.d.ts`) are in sync before running the verification suite.
