"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ManualTriggerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Settings dialog for the Manual Trigger node.
 * Purely informational — this trigger has no configuration.
 */
export function ManualTriggerDialog({
  open,
  onOpenChange,
}: ManualTriggerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Trigger</DialogTitle>
          <DialogDescription>
            Configure settings for the manual trigger node.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Used to manually execute a workflow, no configuration available.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
