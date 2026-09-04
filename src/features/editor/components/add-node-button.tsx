"use client"

import { memo } from "react"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Floating "+" button in the editor panel for adding a new node */
export const AddNodeButton = memo(() => {
  return (
    <Button
      className="bg-background"
      size="icon"
      variant="outline"
      onClick={() => {}} // TODO: open node picker
    >
      <PlusIcon />
    </Button>
  )
})

AddNodeButton.displayName = "AddNodeButton"
