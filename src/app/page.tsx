import { db } from "@/prisma/db"

/**
 * Server Component that queries the Neon database
 * to verify Prisma 8 is fully operational.
 */
const Page = async () => {
  const users = await db.orm.public.User.all()

  return (
    <div className="flex min-h-svh min-w-0 items-center justify-center p-6">
      {JSON.stringify(users)}
    </div>
  )
}

export default Page
