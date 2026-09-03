"use client"

import { useRouter } from "next/navigation"

import { formatDistanceToNow } from "date-fns"
import { WorkflowIcon } from "lucide-react"

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
import { useEntitySearch } from "@/hooks/use-entity-search"
import { useUpgradeModal } from "@/hooks/use-upgrade-modal"
import type { RouterOutputs } from "@/trpc/client"

import {
  useCreateWorkflow,
  useRemoveWorkflow,
  useSuspenseWorkflows,
} from "../hooks/use-workflows"
import { useWorkflowsParams } from "../hooks/use-workflows-params"

export type Workflow = RouterOutputs["workflows"]["getMany"]["items"][number]

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
    <EntityList
      emptyView={<WorkflowsEmpty />}
      getKey={(workflow) => workflow.id}
      items={workflows.data.items}
      renderItem={(workflow) => <WorkflowItem data={workflow} />}
    />
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

/** Loading state shown while the workflows query is in flight. */
export function WorkflowsLoading() {
  return <LoadingView message="Loading workflows..." />
}

/** Error state shown when the workflows query fails. */
export function WorkflowsError() {
  return <ErrorView message="Error loading workflows" />
}

/**
 * Empty state shown when the user has no workflows yet.
 * Provides a "new workflow" action, same behavior as `WorkflowsHeader`.
 */
export function WorkflowsEmpty() {
  const router = useRouter()
  const createWorkflow = useCreateWorkflow()
  const { handleError, modal } = useUpgradeModal()

  const handleCreate = () => {
    createWorkflow.mutate(undefined, {
      onError: (error) => {
        handleError(error)
      },
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`)
      },
    })
  }

  return (
    <>
      {modal}
      <EmptyView
        message="You haven't created any workflows yet. Get started by creating your first workflow"
        title="No Workflows"
        onNew={handleCreate}
      />
    </>
  )
}

/** Single row in the workflows list, with delete action via dropdown menu. */
export function WorkflowItem({ data }: { data: Workflow }) {
  const removeWorkflow = useRemoveWorkflow()

  const handleRemove = () => {
    removeWorkflow.mutate({ id: data.id })
  }

  return (
    <EntityItem
      href={`/workflows/${data.id}`}
      image={
        <div className="flex size-8 items-center justify-center">
          <WorkflowIcon className="size-5 text-muted-foreground" />
        </div>
      }
      isRemoving={removeWorkflow.isPending}
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
