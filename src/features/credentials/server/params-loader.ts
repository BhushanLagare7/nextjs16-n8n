import { createLoader } from "nuqs/server"

import { credentialsParams } from "../params"

/**
 * Server-side loader for parsing credentials query params
 * (e.g. in a Server Component or route handler).
 */
export const credentialsParamsLoader = createLoader(credentialsParams)
