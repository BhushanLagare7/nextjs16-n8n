import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/lib/auth"

// Exposes better-auth's handler as Next.js
// App Router GET/POST route handlers
export const { GET, POST } = toNextJsHandler(auth.handler)
