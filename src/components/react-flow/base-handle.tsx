import { forwardRef } from "react"

import { Handle, type HandleProps } from "@xyflow/react"

import { cn } from "@/lib/utils"

export type BaseHandleProps = HandleProps

/** Styled wrapper around React Flow's `Handle` (connection point) */
export const BaseHandle = forwardRef<HTMLDivElement, BaseHandleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Handle
        ref={ref}
        className={cn(
          "size-[11px] rounded-full border border-border bg-background transition-colors hover:border-primary hover:bg-primary",
          className
        )}
        {...props}
      >
        {children}
      </Handle>
    )
  }
)

BaseHandle.displayName = "BaseHandle"
