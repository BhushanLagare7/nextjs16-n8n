import { paginationParams } from "@/lib/pagination"

/**
 * URL query param schema for the executions list page.
 * Used by both the client hook (useQueryStates) and the
 * server-side loader for consistent parsing/serialization.
 */
export const executionsParams = {
  ...paginationParams(),
}
