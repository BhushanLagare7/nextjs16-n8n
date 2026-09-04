"use client"

import { memo, useState } from "react"

import { PlusIcon } from "lucide-react"

import { NodeSelector } from "@/components/node-selector"
import { Button } from "@/components/ui/button"

/** Floating "+" button in the editor panel for adding a new node */
export const AddNodeButton = memo(() => {
  const [selectorOpen, setSelectorOpen] = useState(false)

  return (
    <NodeSelector open={selectorOpen} onOpenChange={setSelectorOpen}>
      <Button
        aria-label="Add node"
        className="bg-background"
        size="icon"
        variant="outline"
        onClick={() => {}} // TODO: open node picker
      >
        <PlusIcon />
      </Button>
    </NodeSelector>
  )
})

AddNodeButton.displayName = "AddNodeButton"
