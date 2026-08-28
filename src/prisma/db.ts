import postgres from "@prisma/orm-postgres/runtime"

import type { Contract } from "./contract.d"
import contractJson from "./contract.json" with { type: "json" }

// Cache the db client on the global object to avoid creating
// a new connection on every hot-reload in development.
const globalForPrisma = global as unknown as {
  db: ReturnType<typeof postgres<Contract>>
}

/**
 * Prisma Postgres client instance.
 * Reuses the cached client if one already exists (dev mode),
 * otherwise creates a new one from the generated contract.
 */
export const db =
  globalForPrisma.db ??
  postgres<Contract>({
    contractJson,
    url: process.env["DATABASE_URL"]!,
  })

// Only cache in non-production environments to prevent
// exhausting connections during local development.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db
}
