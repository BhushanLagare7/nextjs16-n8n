"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

import { formatDistanceToNow } from "date-fns"

import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
  LoadingView,
} from "@/components/entity-components"
import { CredentialType } from "@/config/constants"
import { useEntitySearch } from "@/hooks/use-entity-search"
import type { RouterOutputs } from "@/trpc/client"

import {
  useRemoveCredential,
  useSuspenseCredentials,
} from "../hooks/use-credentials"
import { useCredentialsParams } from "../hooks/use-credentials-params"

export type Credential =
  RouterOutputs["credentials"]["getMany"]["items"][number]

/**
 * Debounced search input for the credentials list, synced with URL params.
 */
export function CredentialsSearch() {
  const [params, setParams] = useCredentialsParams()
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams,
  })

  return (
    <EntitySearch
      placeholder="Search credentials"
      value={searchValue}
      onChange={onSearchChange}
    />
  )
}

/**
 * Renders the list of credentials for the current user.
 * Assumes it is wrapped in a Suspense boundary by the parent.
 */
export function CredentialsList() {
  const credentials = useSuspenseCredentials()

  return (
    <EntityList
      emptyView={<CredentialsEmpty />}
      getKey={(credential) => credential.id}
      items={credentials.data.items}
      renderItem={(credential) => <CredentialItem data={credential} />}
    />
  )
}

/**
 * Header for the credentials page with a "New credential" action.
 */
export function CredentialsHeader({ disabled }: { disabled?: boolean }) {
  return (
    <EntityHeader
      description="Create and manage your credentials"
      disabled={disabled}
      newButtonHref="/credentials/new"
      newButtonLabel="New credential"
      title="Credentials"
    />
  )
}

/**
 * Pagination control for the credentials list, synced with URL params.
 * Disabled while a background refetch is in progress.
 */
export function CredentialsPagination() {
  const credentials = useSuspenseCredentials()
  const [params, setParams] = useCredentialsParams()

  return (
    <EntityPagination
      disabled={credentials.isFetching}
      page={credentials.data.page}
      totalPages={credentials.data.totalPages}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  )
}

/**
 * Page-level layout wrapper for the credentials page,
 * composing header, search, pagination, and content.
 */
export function CredentialsContainer({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EntityContainer
      header={<CredentialsHeader />}
      pagination={<CredentialsPagination />}
      search={<CredentialsSearch />}
    >
      {children}
    </EntityContainer>
  )
}

/** Loading state shown while the credentials query is in flight. */
export function CredentialsLoading() {
  return <LoadingView message="Loading credentials..." />
}

/** Error state shown when the credentials query fails. */
export function CredentialsError() {
  return <ErrorView message="Error loading credentials" />
}

/**
 * Empty state shown when the user has no credentials yet.
 */
export function CredentialsEmpty() {
  const router = useRouter()

  const handleCreate = () => {
    router.push("/credentials/new")
  }

  return (
    <EmptyView
      message="You haven't created any credentials yet. Get started by creating your first credential"
      title="No Credentials"
      onNew={handleCreate}
    />
  )
}

const credentialLogos: Record<CredentialType, string> = {
  [CredentialType.OPENAI]: "/logos/openai.svg",
  [CredentialType.ANTHROPIC]: "/logos/anthropic.svg",
  [CredentialType.GEMINI]: "/logos/gemini.svg",
}

/** Single row in the credentials list, with delete action via dropdown menu. */
export function CredentialItem({ data }: { data: Credential }) {
  const removeCredential = useRemoveCredential()

  const handleRemove = () => {
    removeCredential.mutate({ id: data.id })
  }

  const logo = credentialLogos[data.type] || "/logos/openai.svg"

  return (
    <EntityItem
      href={`/credentials/${data.id}`}
      image={
        <div className="flex size-8 items-center justify-center">
          <Image alt={data.type} height={20} src={logo} width={20} />
        </div>
      }
      isRemoving={removeCredential.isPending}
      subtitle={
        <>
          Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })}{" "}
          &bull; Created{" "}
          {formatDistanceToNow(data.createdAt, { addSuffix: true })}
        </>
      }
      title={data.name}
      onRemove={handleRemove}
    />
  )
}
