# Next.js 16 & React 19 Conventions

## Next.js 16 App Router Conventions

### Async Route Parameters

In Next.js 16, dynamic route `params` and `searchParams` in server components and layouts are **Promises**. You must always `await` them before reading properties:

```typescript
// ✅ Correct (Next.js 16)
export default async function WorkflowPage({
  params,
  searchParams,
}: {
  params: Promise<{ workflowId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { workflowId } = await params
  const { tab } = await searchParams

  return <div>Workflow: {workflowId} (Tab: {tab})</div>
}
```

```typescript
// ❌ Incorrect — will produce runtime warnings / errors in Next.js 16
export default function WorkflowPage({
  params,
}: {
  params: { workflowId: string }
}) {
  const { workflowId } = params // Error: params is a Promise
  return <div>Workflow: {workflowId}</div>
}
```

### Next.js Documentation Reference

This repository runs Next.js 16. Internal framework reference documentation is resolved locally at:
`node_modules/next/dist/docs/`

---

## React 19 & Compiler Rules

### React Hook Form: `useWatch` vs `form.watch()`

> [!WARNING]
> **Never call `form.watch()` directly inside component render bodies.**
> Calling `form.watch()` breaks React Compiler automatic memoization and causes unnecessary component re-renders.

Always use the `useWatch` hook from `react-hook-form`:

```tsx
import { useWatch } from "react-hook-form"

// In your component:
const method =
  useWatch({
    control: form.control,
    name: "method",
    defaultValue: "GET",
  }) || "GET"
```

#### Why combine `defaultValue` with `||` fallback?

`defaultValue` in `useWatch` is only applied when the form value is `undefined`. Because text inputs and select forms frequently initialize with an empty string (`""`), pairing `defaultValue` with a boolean fallback (`|| "fallback"`) ensures the fallback is shown during initial render states.

---

## Client vs. Server Components

- **Server Components by Default**: All files under `src/app/` are React Server Components unless explicitly marked with `"use client"`.
- **Client Boundaries**: Add `"use client"` only at leaf components that require interactivity, React state (`useState`, `useReducer`), hooks, browser APIs, or React Flow canvas listeners.
- Keep client component bundles lean by passing server data or server components as `children`.
