"use client"

import * as React from "react"

import { Separator as SeparatorPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Separator
 * Visually or semantically separates content.
 * Wraps Radix's Separator primitive with default styling.
 */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true, // marks as decorative for a11y (ignored by screen readers) by default
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
        className
      )}
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  )
}

export { Separator }
