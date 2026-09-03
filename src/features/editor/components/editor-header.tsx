"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { SaveIcon } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  useSuspenseWorkflow,
  useUpdateWorkflowName,
} from "@/features/workflows/hooks/use-workflows"

/**
 * Save button for the editor.
 * NOTE: currently a stub — always enabled, no-op on click.
 */
export function EditorSaveButton({ workflowId }: { workflowId: string }) {
  return (
    <div className="ml-auto">
      <Button
        disabled={false}
        size="sm"
        onClick={() => {
          void workflowId
        }}
      >
        <SaveIcon className="size-4" />
        Save
      </Button>
    </div>
  )
}

/**
 * Inline-editable workflow name shown in the breadcrumb trail.
 * Click to edit, Enter to save, Escape to cancel, blur to save.
 */
export function EditorNameInput({ workflowId }: { workflowId: string }) {
  const { data: workflow } = useSuspenseWorkflow(workflowId)
  const updateWorkflow = useUpdateWorkflowName()

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(workflow.name)

  const inputRef = useRef<HTMLInputElement>(null)

  // Focus and select the input text as soon as edit mode is entered
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    // Skip the mutation entirely if nothing changed
    if (name === workflow.name) {
      setIsEditing(false)
      return
    }

    try {
      await updateWorkflow.mutateAsync({
        id: workflowId,
        name,
      })
    } catch {
      // Revert to the last known good name on failure
      setName(workflow.name)
    } finally {
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setName(workflow.name)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <BreadcrumbItem>
        <Input
          ref={inputRef}
          className="h-7 w-auto min-w-[100px] px-2"
          disabled={updateWorkflow.isPending}
          value={name}
          onBlur={handleSave}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </BreadcrumbItem>
    )
  }

  return (
    <BreadcrumbItem
      className="cursor-pointer transition-colors hover:text-foreground"
      onClick={() => {
        setName(workflow.name)
        setIsEditing(true)
      }}
    >
      {workflow.name}
    </BreadcrumbItem>
  )
}

/** Breadcrumb trail: Workflows list -> editable current workflow name */
export function EditorBreadcrumbs({ workflowId }: { workflowId: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/workflows" prefetch>
              Workflows
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <EditorNameInput workflowId={workflowId} />
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/** Sticky header for the workflow editor: sidebar trigger, breadcrumbs, save button */
export function EditorHeader({ workflowId }: { workflowId: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex w-full flex-row items-center justify-between gap-x-4">
        <EditorBreadcrumbs workflowId={workflowId} />
        <EditorSaveButton workflowId={workflowId} />
      </div>
    </header>
  )
}
