# Inngest Background Jobs & Durable Execution

> [!IMPORTANT]
> This project uses **Inngest v4**.
> The v4 SDK has breaking changes from v3 (trigger configuration syntax, realtime imports, and serve options).

---

## File Architecture

| File                           | Purpose                                                          |
| :----------------------------- | :--------------------------------------------------------------- |
| `src/inngest/client.ts`        | Inngest client instance and event type definitions               |
| `src/inngest/functions.ts`     | Durable background function definitions (workflow execution)     |
| `src/app/api/inngest/route.ts` | Next.js App Router serve handler endpoint                        |
| `src/inngest/utils.ts`         | Graph utilities (topological DAG sorting for workflow node runs) |
| `src/inngest/channels/`        | Native Inngest realtime channels for UI status streaming         |

---

## Durable Step Execution Rules

Inngest guarantees durability by memoizing step results. On retries or server restarts, previously completed steps return cached results without re-executing.

### 1. Wrap All Side Effects in `step.run()`

Never perform database mutations, external HTTP calls, or file system writes directly in the function body without wrapping them in `step.run()`:

```typescript
// ✅ Correct
const result = await step.run("execute-http-node", async () => {
  return await executeHttpNode(nodeConfig)
})

// ❌ Incorrect — direct side effects will re-run on every function step retry
const result = await executeHttpNode(nodeConfig)
```

### 2. Use `step.sleep()` for Delays

Never use `setTimeout` or `new Promise((resolve) => setTimeout(resolve, ...))` in durable workflows. Use Inngest step sleep:

```typescript
// ✅ Sleep survives server restarts and zero-downtime deploys
await step.sleep("wait-before-retry", "5m")
```

### 3. Use `step.waitForEvent()` for External Events

Wait for webhooks, human approval, or external callback signals with timeouts:

```typescript
const approval = await step.waitForEvent("wait-for-human-approval", {
  event: "workflow/approval.submitted",
  timeout: "24h",
  match: "data.workflowId",
})
```

---

## Realtime Progress Streaming

Workflow execution progress is streamed live to the browser:

- Status updates and node execution results are published from within `step.run()` to Inngest realtime channels (`src/inngest/channels/`).
- The frontend client subscribes to these channels to update node statuses (running, success, error) and render live execution output logs.

---

## Local Development & Inngest Dashboard

When running locally, start the Inngest CLI dev server:

```bash
npm run inngest:dev
```

This launches the local Inngest Dashboard at:
[http://localhost:8288](http://localhost:8288)

The dashboard allows you to:

- Inspect registered functions and event streams.
- Manually trigger test events.
- Replay failed workflow runs and inspect step-by-step payloads.
