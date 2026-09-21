import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import type { Metadata } from "next"

import type { SearchParams } from "nuqs/server"

import {
  CredentialsContainer,
  CredentialsError,
  CredentialsList,
  CredentialsLoading,
} from "@/features/credentials/components/credentials"
import { credentialsParamsLoader } from "@/features/credentials/server/params-loader"
import { prefetchCredentials } from "@/features/credentials/server/prefetch"
import { requireAuth } from "@/lib/auth-utils"
import { HydrateClient } from "@/trpc/server"

export const metadata: Metadata = {
  title: "Credentials",
}

type Props = {
  searchParams: Promise<SearchParams>
}

/**
 * Lists all credentials (protected route) with search and pagination
 */
export default async function CredentialsPage({ searchParams }: Props) {
  await requireAuth()

  const params = await credentialsParamsLoader(searchParams)
  prefetchCredentials(params)

  return (
    <CredentialsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<CredentialsError />}>
          <Suspense fallback={<CredentialsLoading />}>
            <CredentialsList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </CredentialsContainer>
  )
}
