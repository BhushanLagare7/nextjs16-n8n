# Observability & Debugging Guidelines

## Sentry Observability Architecture

Sentry is integrated across all Next.js application runtimes to capture errors, distributed traces, and session replays:

| Runtime            | Configuration File                                   | Purpose                                                                |
| :----------------- | :--------------------------------------------------- | :--------------------------------------------------------------------- |
| **Server**         | `sentry.server.config.ts` + `src/instrumentation.ts` | Server-side API error tracking, tRPC handlers, and distributed tracing |
| **Edge**           | `sentry.edge.config.ts`                              | Edge runtime telemetry                                                 |
| **Client**         | `src/instrumentation-client.ts`                      | Browser errors, client-side exceptions, and session replay             |
| **Error Boundary** | `src/app/global-error.tsx`                           | Global React error fallback boundary                                   |

---

## Debugging Workflow & Tips

### 1. Inspect Sibling Code First

Before introducing new patterns or libraries, review existing implementations in the codebase:

- **Executors**: Inspect `src/features/executions/components/http-request/executor.ts` or `manual-trigger/executor.ts` for established executor patterns.
- **Canvas Components**: Inspect `src/components/react-flow/` and `src/features/editor/` for custom node handles, drag behaviors, and context hooks.
- **Inngest Functions**: Check `src/inngest/functions.ts` for established step handling and error boundaries.

### 2. Surgical, Targeted Edits

- Pinpoint the exact failing file rather than making speculative wide changes.
- Apply high-confidence, surgical fixes matching existing conventions.

### 3. Inngest Local Dashboard

When debugging background job failures or step re-executions:

- Open the local Inngest dashboard: [http://localhost:8288](http://localhost:8288)
- View real-time function runs, payload inputs/outputs for each step, and step execution timelines.
- Re-send test events directly to verify fixes without triggering external webhooks.

### 4. React Flow Canvas Debugging

- Custom nodes and edges leverage `@xyflow/react`.
- When debugging handle connections, verify that each `Handle` component specifies unique `id`, valid `type` (`"source"` or `"target"`), and correct `position` (`Position.Left`, `Position.Right`, etc.).
- Ensure node state changes use immutable state updates or the `useReactFlow()` hook methods (`setNodes`, `setEdges`).
