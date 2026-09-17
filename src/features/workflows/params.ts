import { parseAsString } from "nuqs/server"

import { paginationParams } from "@/lib/pagination"

/**
 * URL query param schema for the workflows list page.
 * Used by both the client hook (useQueryStates) and the
 * server-side loader for consistent parsing/serialization.
 */
export const workflowsParams = {
  ...paginationParams(),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
}
