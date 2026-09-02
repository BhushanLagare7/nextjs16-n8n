import { createLoader } from "nuqs/server"

import { workflowsParams } from "../params"

/**
 * Server-side loader for parsing workflows query params
 * (e.g. in a Server Component or route handler).
 */
export const workflowsParamsLoader = createLoader(workflowsParams)
