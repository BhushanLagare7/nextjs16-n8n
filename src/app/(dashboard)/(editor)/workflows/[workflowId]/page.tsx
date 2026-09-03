import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

import {
  Editor,
  EditorError,
  EditorLoading,
} from "@/features/editor/components/editor"
import { EditorHeader } from "@/features/editor/components/editor-header"
import { prefetchWorkflow } from "@/features/workflows/server/prefetch"
import { requireAuth } from "@/lib/auth-utils"
import { HydrateClient } from "@/trpc/server"

interface WorkflowIdPageProps {
  params: Promise<{
    workflowId: string
  }>
}

/**
 * Workflow editor page with prefetching, suspense, and error boundaries
 */
export default async function WorkflowIdPage({ params }: WorkflowIdPageProps) {
  // Redirect to login if the user is not authenticated
  await requireAuth()

  const { workflowId } = await params

  // Kick off server-side prefetch so the client cache is warm on hydration
  prefetchWorkflow(workflowId)

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<EditorError />}>
        <Suspense fallback={<EditorLoading />}>
          <EditorHeader workflowId={workflowId} />
          <main className="flex-1">
            <Editor workflowId={workflowId} />
          </main>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  )
}
