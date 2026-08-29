import { Suspense } from "react"

import { HydrateClient, prefetch, trpc } from "@/trpc/server"

import { Client } from "./client"

/**
 * Server Component that queries the Neon database
 * to verify Prisma 8 is fully operational.
 */
export default async function HomePage() {
  // Prefetch users on the server so the client can hydrate immediately
  void prefetch(trpc.getUsers.queryOptions())

  return (
    <div className="flex min-h-svh min-w-0 items-center justify-center p-6">
      <HydrateClient>
        <Suspense fallback={<p>Loading...</p>}>
          <Client />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
