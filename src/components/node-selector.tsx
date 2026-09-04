"use client"

import { useCallback } from "react"

import { createId } from "@paralleldrive/cuid2"
import { useReactFlow } from "@xyflow/react"
import { GlobeIcon, MousePointerIcon } from "lucide-react"
import { toast } from "sonner"

import { NodeType } from "@/config/constants"

import { Separator } from "./ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"

/** A selectable entry in the node picker */
export type NodeTypeOption = {
  type: NodeType
  label: string
  description: string
  /** Lucide icon component or an image URL */
  icon: React.ComponentType<{ className?: string }> | string
}

/** Nodes that start a workflow */
const triggerNodes: NodeTypeOption[] = [
  {
    type: NodeType.MANUAL_TRIGGER,
    label: "Trigger manually",
    description:
      "Runs the flow on clicking a button. Good for getting started quickly",
    icon: MousePointerIcon,
  },
]

/** Nodes that perform an action within a workflow */
const executionNodes: NodeTypeOption[] = [
  {
    type: NodeType.HTTP_REQUEST,
    label: "HTTP Request",
    description: "Makes an HTTP request",
    icon: GlobeIcon,
  },
]

interface NodeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Element that opens the sheet when clicked */
  children: React.ReactNode
}

/**
 * Side sheet listing available node types.
 * Selecting one adds it to the canvas near the viewport center.
 */
export function NodeSelector({
  open,
  onOpenChange,
  children,
}: NodeSelectorProps) {
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow()

  const handleNodeSelect = useCallback(
    (selection: NodeTypeOption) => {
      // Only one manual trigger is allowed per workflow
      if (selection.type === NodeType.MANUAL_TRIGGER) {
        const nodes = getNodes()
        const hasManualTrigger = nodes.some(
          (node) => node.type === NodeType.MANUAL_TRIGGER
        )

        if (hasManualTrigger) {
          toast.error("Only one manual trigger is allowed per workflow")
          return
        }
      }

      setNodes((nodes) => {
        const hasInitialTrigger = nodes.some(
          (node) => node.type === NodeType.INITIAL
        )

        // Place near screen center with slight jitter so nodes don't stack
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2

        const flowPosition = screenToFlowPosition({
          x: centerX + (Math.random() - 0.5) * 200,
          y: centerY + (Math.random() - 0.5) * 200,
        })

        const newNode = {
          id: createId(),
          data: {},
          position: flowPosition,
          type: selection.type,
        }

        // Replace the placeholder initial node instead of appending
        if (hasInitialTrigger) {
          return [newNode]
        }

        return [...nodes, newNode]
      })

      onOpenChange(false)
    },
    [setNodes, getNodes, onOpenChange, screenToFlowPosition]
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md" side="right">
        <SheetHeader>
          <SheetTitle>What triggers this workflow?</SheetTitle>
          <SheetDescription>
            A trigger is a step that starts your workflow.
          </SheetDescription>
        </SheetHeader>

        {/* Trigger nodes */}
        <div>
          {triggerNodes.map((nodeType) => {
            const Icon = nodeType.icon

            return (
              <div
                key={nodeType.type}
                className="h-auto w-full cursor-pointer justify-start rounded-none border-l-2 border-transparent px-4 py-5 hover:border-l-primary"
                onClick={() => handleNodeSelect(nodeType)}
              >
                <div className="flex w-full items-center gap-6 overflow-hidden">
                  {typeof Icon === "string" ? (
                    <img
                      alt={nodeType.label}
                      className="size-5 rounded-sm object-contain"
                      src={Icon}
                    />
                  ) : (
                    <Icon className="size-5" />
                  )}
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {nodeType.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {nodeType.description}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Execution nodes */}
        <div>
          {executionNodes.map((nodeType) => {
            const Icon = nodeType.icon

            return (
              <div
                key={nodeType.type}
                className="h-auto w-full cursor-pointer justify-start rounded-none border-l-2 border-transparent px-4 py-5 hover:border-l-primary"
                onClick={() => handleNodeSelect(nodeType)}
              >
                <div className="flex w-full items-center gap-6 overflow-hidden">
                  {typeof Icon === "string" ? (
                    <img
                      alt={nodeType.label}
                      className="size-5 rounded-sm object-contain"
                      src={Icon}
                    />
                  ) : (
                    <Icon className="size-5" />
                  )}
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {nodeType.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {nodeType.description}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
