"use client"

import { useRouter } from "next/navigation"

import {
  EntityContainer,
  EntityHeader,
  EntityPagination,
  EntitySearch,
} from "@/components/entity-components"
import { useEntitySearch } from "@/hooks/use-entity-search"
import { useUpgradeModal } from "@/hooks/use-upgrade-modal"

import { useCreateWorkflow, useSuspenseWorkflows } from "../hooks/use-workflows"
import { useWorkflowsParams } from "../hooks/use-workflows-params"

/**
 * Debounced search input for the workflows list, synced with URL params.
 */
export function WorkflowsSearch() {
  const [params, setParams] = useWorkflowsParams()
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams,
  })

  return (
    <EntitySearch
      placeholder="Search workflows"
      value={searchValue}
      onChange={onSearchChange}
    />
  )
}

/**
 * Renders the list of workflows for the current user.
 * Assumes it's wrapped in a Suspense boundary by the parent.
 */
export function WorkflowsList() {
  const workflows = useSuspenseWorkflows()

  return (
    <div className="flex flex-1 items-center justify-center">
      {/* TODO: replace raw JSON dump with an actual workflow list UI */}
      <pre>{JSON.stringify(workflows.data, null, 2)}</pre>
    </div>
  )
}

/**
 * Header for the workflows page with a "New workflow" action.
 * On success, navigates to the newly created workflow's page.
 * Shows an upgrade modal if creation is blocked due to subscription limits.
 */
export function WorkflowsHeader({ disabled }: { disabled?: boolean }) {
  const router = useRouter()
  const createWorkflow = useCreateWorkflow()
  const { handleError, modal } = useUpgradeModal()

  const handleCreate = () => {
    createWorkflow.mutate(undefined, {
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`)
      },
      onError: (error) => {
        // Surfaces subscription/limit errors via the upgrade modal
        handleError(error)
      },
    })
  }

  return (
    <>
      {modal}
      <EntityHeader
        description="Create and manage your workflows"
        disabled={disabled}
        isCreating={createWorkflow.isPending}
        newButtonLabel="New workflow"
        title="Workflows"
        onNew={handleCreate}
      />
    </>
  )
}

/**
 * Pagination control for the workflows list, synced with URL params.
 * Disabled while a background refetch is in progress.
 */
export function WorkflowsPagination() {
  const workflows = useSuspenseWorkflows()
  const [params, setParams] = useWorkflowsParams()

  return (
    <EntityPagination
      disabled={workflows.isFetching}
      page={workflows.data.page}
      totalPages={workflows.data.totalPages}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  )
}

/**
 * Page-level layout wrapper for the workflows page,
 * composing header, search, pagination, and content.
 */
export function WorkflowsContainer({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EntityContainer
      header={<WorkflowsHeader />}
      pagination={<WorkflowsPagination />}
      search={<WorkflowsSearch />}
    >
      {children}
    </EntityContainer>
  )
}
