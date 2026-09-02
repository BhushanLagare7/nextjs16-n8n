"use client"

import { useRouter } from "next/navigation"

import { EntityContainer, EntityHeader } from "@/components/entity-components"
import { useUpgradeModal } from "@/hooks/use-upgrade-modal"

import { useCreateWorkflow, useSuspenseWorkflows } from "../hooks/use-workflows"

/**
 * Renders the list of workflows for the current user.
 * Assumes it's wrapped in a Suspense boundary by the parent.
 */
export function WorkflowsList() {
  const workflows = useSuspenseWorkflows()

  return (
    <div className="flex flex-1 items-center justify-center">
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
 * Page-level layout wrapper for the workflows page
 */
export function WorkflowsContainer({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EntityContainer
      header={<WorkflowsHeader />}
      pagination={<></>}
      search={<></>}
    >
      {children}
    </EntityContainer>
  )
}
