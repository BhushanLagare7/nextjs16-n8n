import { parseAsInteger, parseAsString } from "nuqs/server"

import { PAGINATION } from "@/config/constants"

/**
 * URL query param schema for the workflows list page.
 * Used by both the client hook (useQueryStates) and the
 * server-side loader for consistent parsing/serialization.
 */
export const workflowsParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
}
