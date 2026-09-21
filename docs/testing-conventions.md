# Testing Conventions & Instructions

## Testing Framework & Runner

This repository uses Node's native test runner executed via **TSX**:

```bash
npm run test
```

Command definition in `package.json`:
`tsx --test 'src/**/*.test.ts'`

---

## Test File Placement

- **Co-location**: Unit and integration tests are co-located directly alongside the implementation files inside `src/`.
- **Naming Pattern**: All test files must follow the pattern `*.test.ts` or `*.test.tsx`.

### Existing Examples

- `src/lib/encryption.test.ts` — Tests for AES credential encryption and decryption helpers.
- `src/lib/pagination.test.ts` — Tests for cursor-based pagination utilities.

---

## When to Add or Update Tests

1. **Utility Functions**: Any change to `src/lib/` (encryption, formatting, parsing, pagination).
2. **Workflow Graph Algorithms**: Any modifications to topological sorting or DAG resolution in `src/inngest/utils.ts`.
3. **Node Executors**: Any custom executor logic that transforms inputs, validates schemas, or computes dynamic values.
4. **Bug Fixes**: When fixing an edge case or regression, write a reproducing unit test before submitting the fix.

---

## Quality Suite Verification

Running tests is part of the full validation check. Always run the verification suite before finishing:

```bash
npm run test && npm run typecheck
```
