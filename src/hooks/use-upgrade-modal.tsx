import { useState } from "react"

import { TRPCClientError } from "@trpc/client"

import { UpgradeModal } from "@/components/upgrade-modal"

/**
 * Hook to manage the "upgrade to Pro" modal.
 * Use `handleError` in a mutation's onError callback to automatically
 * show the modal when the server responds with a FORBIDDEN error
 * (i.e. the user lacks an active subscription).
 */
export function useUpgradeModal() {
  const [open, setOpen] = useState(false)

  /** Returns true if the error was handled (i.e. modal was shown) */
  const handleError = (error: unknown) => {
    if (error instanceof TRPCClientError) {
      if (error.data?.code === "FORBIDDEN") {
        setOpen(true)
        return true
      }
    }
    return false
  }

  const modal = <UpgradeModal open={open} onOpenChange={setOpen} />

  return { handleError, modal }
}
