import { requireAuth } from "@/lib/auth-utils"
import { caller } from "@/trpc/server"

export default async function HomePage() {
  await requireAuth()

  const users = await caller.getUsers()

  return (
    <div className="flex min-h-svh min-w-0 flex-col items-center justify-center p-6">
      {JSON.stringify(users, null, 2)}
    </div>
  )
}
