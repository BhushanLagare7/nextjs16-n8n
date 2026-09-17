import { useQueryStates } from "nuqs"

import { executionsParams } from "../params"

/**
 * Client-side hook for reading/writing executions list query params (page, pageSize).
 */
export const useExecutionsParams = () => {
  return useQueryStates(executionsParams)
}
