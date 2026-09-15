import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { CredentialView } from "@/features/credentials/components/credential"
import {
  CredentialsError,
  CredentialsLoading,
} from "@/features/credentials/components/credentials"
import { prefetchCredential } from "@/features/credentials/server/prefetch"
import { requireAuth } from "@/lib/auth-utils"
import { HydrateClient } from "@/trpc/server"

interface CredentialIdPageProps {
  params: Promise<{ credentialId: string }>
}

/**
 * Displays details for a single credential (protected route)
 */
export default async function CredentialIdPage({
  params,
}: CredentialIdPageProps) {
  await requireAuth()

  const { credentialId } = await params
  prefetchCredential(credentialId)

  return (
    <div className="h-full p-4 md:px-10 md:py-6">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-y-8">
        <HydrateClient>
          <ErrorBoundary fallback={<CredentialsError />}>
            <Suspense fallback={<CredentialsLoading />}>
              <CredentialView credentialId={credentialId} />
            </Suspense>
          </ErrorBoundary>
        </HydrateClient>
      </div>
    </div>
  )
}
