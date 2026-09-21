# Code Style, TypeScript & Formatting Conventions

## Formatting Rules

The codebase enforces strict code formatting using **Prettier** and **ESLint**:

- **Semicolons**: False (no trailing semicolons)
- **Quotes**: Double quotes (`"`)
- **Indentation**: 2 spaces
- **Trailing Commas**: ES5 style
- **Print Width**: 80 characters
- **Tailwind Plugin**: Uses `prettier-plugin-tailwindcss` with automatic sorting for classes inside `cn()` and `cva()` utility functions.

Formatting commands:

```bash
npm run format        # Auto-format all files
npm run format:check  # Check formatting without writing changes
```

---

## Import Order (ESLint Enforced)

Imports must be ordered into explicit groups separated by newlines, enforced by `eslint-plugin-simple-import-sort`:

1. **Side-effect imports**: CSS or environment side-effects (`import "@/app/globals.css"`)
2. **Core framework imports**: `react`, `next`, and sub-paths (`react`, `next/navigation`, etc.)
3. **Third-party packages**: External dependencies (`@trpc/*`, `@xyflow/react`, `zod`, `inngest`, etc.)
4. **Internal alias imports**: Project root paths starting with `@/` (`@/components/*`, `@/features/*`, `@/lib/*`)
5. **Parent relative imports**: `../`
6. **Sibling relative imports**: `./`

### Example

```typescript
// 1. Side-effects
import "./styles.css"

// 2. React / Next core
import { useEffect, useState } from "react"
import Link from "next/link"

// 3. Third-party packages
import { z } from "zod"
import { useReactFlow } from "@xyflow/react"

// 4. Internal project aliases
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// 5. Parent relative
import { ParentHelper } from "../helpers"

// 6. Sibling relative
import { localConstant } from "./constants"
```

---

## JSX Props Ordering

Props on JSX elements must adhere to the following sequence:

1. **Reserved props first**: `key` and `ref` always come first.
2. **Alphabetically sorted attributes**: Between reserved props and callbacks.
3. **Event handlers and callbacks last**: Any prop matching `^on[A-Z]` (`onClick`, `onChange`, `onSubmit`, etc.) goes at the end.

### Example

```tsx
<WorkflowNode
  key={node.id}
  ref={nodeRef}
  data={node.data}
  id={node.id}
  isSelected={selected}
  title={node.title}
  onChange={handleNodeChange}
  onClick={handleNodeClick}
/>
```

---

## TypeScript Guidelines

- **Strict Mode**: TypeScript strict mode is enabled. All types must be explicit.
- **No `any`**: Do not use `any` or loose index signatures like `Record<string, any>`. Use `unknown`, generic parameters, or explicit interfaces.
- **Path Aliases**: Always use `@/*` mapping to `./src/*` instead of deeply nested relative paths (`../../../`).
- **Zod v4 Validation**: Always use Zod for runtime API, parameter, and form validations. Infer static TypeScript types using `z.infer`:

```typescript
import { z } from "zod"

export const nodeConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  retries: z.number().int().min(0).default(3),
})

export type NodeConfig = z.infer<typeof nodeConfigSchema>
```

- **Compile Verification**: Always verify type safety using `npm run typecheck` (`tsc --noEmit`).
