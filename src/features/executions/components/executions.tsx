"use client"

import React from "react"

import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react"

import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  ErrorView,
  LoadingView,
} from "@/components/entity-components"
import { ExecutionStatus } from "@/config/constants"
import type { RouterOutputs } from "@/trpc/client"

import { useSuspenseExecutions } from "../hooks/use-executions"
import { useExecutionsParams } from "../hooks/use-executions-params"

export type ExecutionListItem =
  RouterOutputs["executions"]["getMany"]["items"][number]

/**
 * Maps an execution status to its representative icon.
 *
 * @param status - Execution status
 * @returns Icon element for the given status
 */
const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case ExecutionStatus.SUCCESS:
      return <CheckCircle2Icon className="size-5 text-green-600" />
    case ExecutionStatus.FAILED:
      return <XCircleIcon className="size-5 text-red-600" />
    case ExecutionStatus.RUNNING:
      return <Loader2Icon className="size-5 animate-spin text-blue-600" />
    default:
      return <ClockIcon className="size-5 text-muted-foreground" />
  }
}

/**
 * Converts an execution status enum value into a display-friendly label.
 *
 * @param status - Execution status
 * @returns Capitalized, human-readable status string
 */
const formatStatus = (status: ExecutionStatus) => {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

/** Renders the list of executions, falling back to an empty state. */
export const ExecutionsList = () => {
  const executions = useSuspenseExecutions()

  return (
    <EntityList
      emptyView={<ExecutionsEmpty />}
      getKey={(execution) => execution.id}
      items={executions.data.items}
      renderItem={(execution) => <ExecutionItem data={execution} />}
    />
  )
}

/** Header section for the executions page. */
export const ExecutionsHeader = () => {
  return (
    <EntityHeader
      description="View your workflow execution history"
      title="Executions"
    />
  )
}

/** Pagination controls synced with executions query params. */
export const ExecutionsPagination = () => {
  const executions = useSuspenseExecutions()
  const [params, setParams] = useExecutionsParams()

  return (
    <EntityPagination
      disabled={executions.isFetching}
      page={executions.data.page}
      totalPages={executions.data.totalPages}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  )
}

/**
 * Layout wrapper combining the header, pagination, and page content.
 *
 * @param children - Content rendered between header and pagination
 */
export const ExecutionsContainer = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <EntityContainer
      header={<ExecutionsHeader />}
      pagination={<ExecutionsPagination />}
    >
      {children}
    </EntityContainer>
  )
}

/** Loading state for the executions list. */
export const ExecutionsLoading = () => {
  return <LoadingView message="Loading executions..." />
}

/** Error state for the executions list. */
export const ExecutionsError = () => {
  return <ErrorView message="Error loading executions" />
}

/** Empty state shown when no executions exist. */
export const ExecutionsEmpty = () => {
  return (
    <EmptyView message="You haven't created any executions yet. Get started by running your first workflow" />
  )
}

/**
 * Renders a single execution entry with status, workflow name, and timing.
 *
 * @param data - Execution record to display
 */
export const ExecutionItem = ({ data }: { data: ExecutionListItem }) => {
  const duration = data.completedAt
    ? Math.round(
        (new Date(data.completedAt).getTime() -
          new Date(data.startedAt).getTime()) /
          1000
      )
    : null

  const subtitle = (
    <>
      {data.workflow.name} &bull; Started{" "}
      {formatDistanceToNow(new Date(data.startedAt), { addSuffix: true })}
      {duration !== null && <> &bull; Took {duration}s </>}
    </>
  )

  return (
    <EntityItem
      href={`/executions/${data.id}`}
      image={
        <div className="flex size-8 items-center justify-center">
          {getStatusIcon(data.status)}
        </div>
      }
      subtitle={subtitle}
      title={formatStatus(data.status)}
    />
  )
}
