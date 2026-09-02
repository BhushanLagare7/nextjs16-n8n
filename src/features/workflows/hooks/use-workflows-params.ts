import { useQueryStates } from "nuqs"

import { workflowsParams } from "../params"

/**
 * Client-side hook for reading/writing workflows list query params
 * (page, pageSize, search) synced with the URL.
 */
export const useWorkflowsParams = () => {
  return useQueryStates(workflowsParams)
}
