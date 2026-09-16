import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { CredentialType } from "@/config/constants"
import { useTRPC } from "@/trpc/client"

import { useCredentialsParams } from "./use-credentials-params"

/**
 * Hook to fetch all credentials using suspense.
 * Pagination/search parameters are read from the URL via `useCredentialsParams`.
 */
export function useSuspenseCredentials() {
  const trpc = useTRPC()
  const [params] = useCredentialsParams()

  return useSuspenseQuery(trpc.credentials.getMany.queryOptions(params))
}

/**
 * Hook to create a new credential.
 * Shows toast feedback and invalidates the credentials list on success/error.
 */
export function useCreateCredential() {
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  return useMutation(
    trpc.credentials.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Credential "${data.name}" created`)
        queryClient.invalidateQueries(trpc.credentials.getMany.queryOptions({}))
      },
      onError: (error) => {
        toast.error(`Failed to create credential: ${error.message}`)
      },
    })
  )
}

/**
 * Hook to remove a credential.
 * Shows toast feedback and invalidates the credentials list and individual
 * credential on success/error.
 */
export function useRemoveCredential() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation(
    trpc.credentials.remove.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Credential "${data.name}" removed`)
        queryClient.invalidateQueries(trpc.credentials.getMany.queryOptions({}))
        queryClient.invalidateQueries(
          trpc.credentials.getOne.queryFilter({ id: data.id })
        )
      },
      onError: (error) => {
        toast.error(`Failed to remove credential: ${error.message}`)
      },
    })
  )
}

/**
 * Hook to fetch a single credential using suspense.
 */
export function useSuspenseCredential(id: string) {
  const trpc = useTRPC()

  return useSuspenseQuery(trpc.credentials.getOne.queryOptions({ id }))
}

/**
 * Hook to update an existing credential.
 * Shows toast feedback and invalidates related queries on success/error.
 */
export function useUpdateCredential() {
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  return useMutation(
    trpc.credentials.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Credential "${data.name}" saved`)
        queryClient.invalidateQueries(trpc.credentials.getMany.queryOptions({}))
        queryClient.invalidateQueries(
          trpc.credentials.getOne.queryOptions({ id: data.id })
        )
      },
      onError: (error) => {
        toast.error(`Failed to save credential: ${error.message}`)
      },
    })
  )
}

/**
 * Hook to fetch credentials filtered by provider type (e.g. for selection dropdowns).
 */
export function useCredentialsByType(type: CredentialType) {
  const trpc = useTRPC()

  return useQuery(trpc.credentials.getByType.queryOptions({ type }))
}
