import { useQueryStates } from "nuqs"

import { credentialsParams } from "../params"

/**
 * Hook to manage credentials search & pagination query parameters in the URL.
 */
export function useCredentialsParams() {
  return useQueryStates(credentialsParams)
}
