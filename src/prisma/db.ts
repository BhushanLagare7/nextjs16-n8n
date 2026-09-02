import postgres from "@prisma/orm-postgres/runtime"

import type { Contract } from "./contract.d"
import contractJson from "./contract.json" with { type: "json" }

// Contract-aware singleton cache on globalThis.
// This preserves the connection pool across normal code hot-reloads to prevent
// connection exhaustion, while automatically creating a fresh client whenever
// contract.json is regenerated with updated schema/codecs.
const globalForPrisma = globalThis as unknown as {
  prismaDb?: ReturnType<typeof postgres<Contract>>
  prismaStorageHash?: string
}

/**
 * Shared database client instance.
 * Reuses the cached client in dev unless the generated contract has changed.
 */
export const db =
  globalForPrisma.prismaDb &&
  globalForPrisma.prismaStorageHash === contractJson.storage.storageHash
    ? globalForPrisma.prismaDb
    : (() => {
        const client = postgres<Contract>({
          contractJson,
          url: process.env["DATABASE_URL"]!,
        })
        // Only cache on globalThis outside production to survive hot reloads
        if (process.env.NODE_ENV !== "production") {
          globalForPrisma.prismaDb = client
          globalForPrisma.prismaStorageHash = contractJson.storage.storageHash
        }
        return client
      })()
