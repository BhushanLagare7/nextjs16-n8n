# Database Workflow & Conventions (Prisma Next)

> [!IMPORTANT]
> This project uses **Prisma Next** (`@prisma/orm-postgres`), NOT standard Prisma.
> There is **no** `prisma/schema.prisma` and **no** `prisma generate`.

---

## Source of Truth Data Contract

The database schema lives entirely in:
[`src/prisma/contract.prisma`](../src/prisma/contract.prisma)

This contract compiles into two generated companion files:

- `src/prisma/contract.json` — **Generated runtime contract. DO NOT edit manually.**
- `src/prisma/contract.d.ts` — **Generated TypeScript definitions. DO NOT edit manually.**

---

## Schema Modification Workflow

When updating or adding models, fields, or relations:

1. **Edit the Contract**:
   Modify [`src/prisma/contract.prisma`](../src/prisma/contract.prisma).

2. **Emit the Contract Types**:
   Run the CLI command to compile the contract and regenerate `.json` and `.d.ts`:

   ```bash
   npm run contract:emit
   ```

   _(or `npx prisma contract emit`)_

3. **Verify Types**:
   Verify everything compiles cleanly:

   ```bash
   npm run typecheck
   ```

4. **Commit Generated Artifacts**:
   Always commit both `contract.json` and `contract.d.ts` alongside your changes to `contract.prisma`.

---

## Querying the Database

Always use the pre-configured runtime client instance from `@/prisma/db`:

```typescript
import { db } from "@/prisma/db"

// 1. Find multiple records
const workflows = await db.orm.public.Workflow.findMany({
  where: { userId },
  orderBy: { updatedAt: "desc" },
})

// 2. Find a single record by unique key
const node = await db.orm.public.Node.findUnique({
  where: { id: nodeId },
})

// 3. Atomic Transactions
await db.transaction(async (tx) => {
  await tx.orm.public.Workflow.update({
    where: { id: workflowId },
    data: { name: "Updated Workflow" },
  })
  await tx.orm.public.Node.create({
    data: {/* ... */},
  })
})
```

---

## Reusing Generated Prisma Types

Never manually declare duplicate TypeScript interfaces for database models. Always import and reuse the generated model types from `FieldOutputTypes`:

```typescript
import type { FieldOutputTypes } from "@/prisma/contract.d"

export type Workflow = FieldOutputTypes["public"]["Workflow"]
export type Node = FieldOutputTypes["public"]["Node"]
export type Connection = FieldOutputTypes["public"]["Connection"]
export type Execution = FieldOutputTypes["public"]["Execution"]
```

### Guidelines for Custom Types

- Only declare custom interfaces for transient, client-only UI state (such as canvas drag coordinates, temporary selection state, or unmodeled external API responses).
- For all persisted database entities, rely exclusively on `FieldOutputTypes`.
