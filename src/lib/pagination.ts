import { createParser } from "nuqs/server"

import { PAGINATION } from "@/config/constants"

/**
 * Creates a nuqs parser for integers clamped to [min, max].
 * Out-of-range values are normalized instead of rejected,
 * ensuring URL params always satisfy the server's input contract.
 */
export const parseAsBoundedInteger = (min: number, max: number) =>
  createParser<number>({
    parse: (value) => {
      const n = parseInt(value, 10)
      if (Number.isNaN(n)) return null
      return Math.max(min, Math.min(max, n))
    },
    serialize: (value) => String(value),
  })

/**
 * Pre-configured page parser: ≥ 1, no practical upper bound.
 */
export const parseAsPage = parseAsBoundedInteger(1, Number.MAX_SAFE_INTEGER)

/**
 * Pre-configured pageSize parser: clamped to [MIN_PAGE_SIZE, MAX_PAGE_SIZE].
 */
export const parseAsPageSize = parseAsBoundedInteger(
  PAGINATION.MIN_PAGE_SIZE,
  PAGINATION.MAX_PAGE_SIZE
)

/**
 * Returns the standard page + pageSize query param schema
 * for use with nuqs `useQueryStates` and server-side loaders.
 *
 * Each feature can spread this into its own params and add
 * feature-specific keys (e.g. `search`).
 */
export const paginationParams = () => ({
  page: parseAsPage
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsPageSize
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
})
