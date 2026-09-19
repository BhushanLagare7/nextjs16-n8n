"use client"

import { useState } from "react"
import Link from "next/link"

import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ExecutionStatus } from "@/config/constants"
import { useSuspenseExecution } from "@/features/executions/hooks/use-executions"

/**
 * Returns the status icon associated with an execution status.
 *
 * @param status - Execution status
 * @returns Icon element representing the status
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
 * Formats an execution status enum into a human-readable label.
 *
 * @param status - Execution status
 * @returns Capitalized status label
 */
const formatStatus = (status: ExecutionStatus) => {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

/**
 * Displays detailed information for a single workflow execution,
 * including status, timing, output, and error details.
 *
 * @param executionId - ID of the execution to display
 */
export const ExecutionView = ({ executionId }: { executionId: string }) => {
  const { data: execution } = useSuspenseExecution(executionId)
  const [showStackTrace, setShowStackTrace] = useState(false)

  const duration = execution.completedAt
    ? Math.round(
        (new Date(execution.completedAt).getTime() -
          new Date(execution.startedAt).getTime()) /
          1000
      )
    : null

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          {getStatusIcon(execution.status)}
          <div>
            <CardTitle>{formatStatus(execution.status)}</CardTitle>
            <CardDescription>
              Execution for {execution.workflow.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Workflow
            </p>
            <Link
              className="text-sm text-primary hover:underline"
              href={`/workflows/${execution.workflowId}`}
              prefetch
            >
              {execution.workflow.name}
            </Link>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-sm">{formatStatus(execution.status)}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Started</p>
            <p className="text-sm">
              {formatDistanceToNow(new Date(execution.startedAt), {
                addSuffix: true,
              })}
            </p>
          </div>

          {execution.completedAt ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <p className="text-sm">
                {formatDistanceToNow(new Date(execution.completedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          ) : null}

          {duration !== null ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Duration
              </p>
              <p className="text-sm">{duration}s</p>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Event ID
            </p>
            <p className="text-sm">{execution.inngestEventId}</p>
          </div>
        </div>

        {execution.error && (
          <div className="mt-6 space-y-3 rounded-md bg-red-50 p-4 dark:bg-red-950/30">
            <div>
              <p className="mb-2 text-sm font-medium text-red-900 dark:text-red-200">
                Error
              </p>
              <p className="font-mono text-sm text-red-800 dark:text-red-300">
                {execution.error}
              </p>
            </div>

            {execution.errorStack && (
              <Collapsible
                open={showStackTrace}
                onOpenChange={setShowStackTrace}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    className="text-red-900 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-900/40"
                    size="sm"
                    variant="ghost"
                  >
                    {showStackTrace ? "Hide stack trace" : "Show stack trace"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 font-mono text-xs text-red-800 dark:bg-red-900/40 dark:text-red-300">
                    {execution.errorStack}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        {execution.output && (
          <div className="mt-6 rounded-md bg-muted p-4">
            <p className="mb-2 text-sm font-medium">Output</p>
            <pre className="overflow-auto font-mono text-xs">
              {JSON.stringify(execution.output, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
