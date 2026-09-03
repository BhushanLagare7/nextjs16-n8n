"use client"

import { ErrorView, LoadingView } from "@/components/entity-components"
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows"

/** Fallback shown while the editor's suspense boundary is resolving */
export function EditorLoading() {
  return <LoadingView message="Loading editor..." />
}

/** Fallback shown when the editor's error boundary catches an error */
export function EditorError() {
  return <ErrorView message="Error loading editor" />
}

/**
 * Main editor view.
 * NOTE: currently just dumps raw workflow JSON — placeholder for the real editor UI.
 */
export function Editor({ workflowId }: { workflowId: string }) {
  const { data: workflow } = useSuspenseWorkflow(workflowId)

  return <pre>{JSON.stringify(workflow, null, 2)}</pre>
}
