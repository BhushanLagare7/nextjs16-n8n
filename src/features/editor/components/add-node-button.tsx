"use client"

import { memo, useState } from "react"

import { PlusIcon } from "lucide-react"

import { NodeSelector } from "@/components/node-selector"
import { Button } from "@/components/ui/button"

/**
 * Floating "+" button in the editor panel for adding a new node.
 * Opens the `NodeSelector` popover on click.
 */
export const AddNodeButton = memo(() => {
  // Controlled open state so both the button and popover trigger stay in sync
  const [selectorOpen, setSelectorOpen] = useState(false)

  return (
    <NodeSelector open={selectorOpen} onOpenChange={setSelectorOpen}>
      <Button
        aria-label="Add node"
        className="bg-background"
        size="icon"
        variant="outline"
        onClick={() => setSelectorOpen(true)}
      >
        <PlusIcon />
      </Button>
    </NodeSelector>
  )
})

AddNodeButton.displayName = "AddNodeButton"
