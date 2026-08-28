import "dotenv/config"

import { definePrismaConfig } from "@prisma/cli-engine"
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config"

/**
 * Prisma CLI configuration.
 * Points the CLI to the contract file and database connection
 * used for generating the client and running migrations.
 */
export default definePrismaConfig({
  orm: ormConfig({
    // Path to the Prisma contract (schema) file
    contract: "./src/prisma/contract.prisma",
    db: {
      // Database connection string, loaded from environment variables
      connection: process.env["DATABASE_URL"]!,
    },
  }),
})
