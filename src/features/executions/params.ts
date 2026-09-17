import { parseAsInteger } from "nuqs/server"

import { PAGINATION } from "@/config/constants"

/**
 * URL query param schema for the executions list page.
 * Used by both the client hook (useQueryStates) and the
 * server-side loader for consistent parsing/serialization.
 */
export const executionsParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
}
