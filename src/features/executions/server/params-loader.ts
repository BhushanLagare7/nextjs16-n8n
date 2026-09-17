import { createLoader } from "nuqs/server"

import { executionsParams } from "../params"

/**
 * Server-side loader for parsing executions query params
 * (e.g. in a Server Component or route handler).
 */
export const executionsParamsLoader = createLoader(executionsParams)
