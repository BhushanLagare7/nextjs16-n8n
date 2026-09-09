import { createContext, type ReactNode, useContext } from "react"

import { CheckIcon, Loader2Icon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** Execution lifecycle status for a workflow node */
export type NodeStatus = "loading" | "success" | "error" | "initial"

/**
 * Visual style for the status indicator.
 * - `overlay`: dims the node and shows a centered spinner (loading only)
 * - `border`: paints an animated/colored border and badge around the node
 */
export type NodeStatusVariant = "overlay" | "border"

export type NodeStatusIndicatorProps = {
  status?: NodeStatus
  variant?: NodeStatusVariant
  className?: string
  children: ReactNode
}

interface NodeStatusContextValue {
  status: NodeStatus
  variant: NodeStatusVariant
}

export const NodeStatusContext = createContext<NodeStatusContextValue>({
  status: "initial",
  variant: "border",
})

/**
 * Hook to read the current node execution status from context.
 */
export const useNodeStatusContext = () => useContext(NodeStatusContext)

/**
 * Human-readable status labels for screen readers.
 */
const STATUS_LABELS: Record<Exclude<NodeStatus, "initial">, string> = {
  loading: "Loading",
  success: "Completed successfully",
  error: "Error occurred",
}

/**
 * High-contrast corner badge displaying a status icon (checkmark, cross, or spinner).
 * Positions itself at the bottom-right corner of the node with a cutout ring matching
 * the canvas background for crisp separation in both light and dark mode.
 */
export function NodeStatusBadge({
  status,
  className,
}: {
  status?: NodeStatus
  className?: string
}) {
  if (!status || status === "initial") return null

  switch (status) {
    case "loading":
      return (
        <div
          aria-label="Status: Loading"
          className={cn(
            "pointer-events-none absolute -right-1 -bottom-1 z-20 flex size-4.5 animate-in items-center justify-center rounded-full bg-blue-600 text-white shadow-sm ring-2 ring-background transition-transform duration-200 zoom-in-75 dark:bg-sky-500",
            className
          )}
          title="Executing..."
        >
          <Loader2Icon className="size-2.5 animate-spin stroke-[2.5]" />
        </div>
      )
    case "success":
      return (
        <div
          aria-label="Status: Success"
          className={cn(
            "pointer-events-none absolute -right-1 -bottom-1 z-20 flex size-4.5 animate-in items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm ring-2 ring-background transition-transform duration-200 zoom-in-75 dark:bg-emerald-500",
            className
          )}
          title="Completed"
        >
          <CheckIcon className="size-2.5 stroke-3" />
        </div>
      )
    case "error":
      return (
        <div
          aria-label="Status: Error"
          className={cn(
            "pointer-events-none absolute -right-1 -bottom-1 z-20 flex size-4.5 animate-in items-center justify-center rounded-full bg-rose-600 text-white shadow-sm ring-2 ring-background transition-transform duration-200 zoom-in-75 dark:bg-rose-500",
            className
          )}
          title="Failed"
        >
          <XIcon className="size-2.5 stroke-3" />
        </div>
      )
  }
}

/**
 * Wraps a node with execution status context and accessibility announcements.
 * When `variant="overlay"` and `status="loading"`, an elegant backdrop blur
 * overlay is shown over the node.
 */
export const NodeStatusIndicator = ({
  status = "initial",
  variant = "border",
  className,
  children,
}: NodeStatusIndicatorProps) => {
  const statusLabel =
    status && status !== "initial" ? STATUS_LABELS[status] : undefined

  return (
    <NodeStatusContext.Provider value={{ status, variant }}>
      <div className={cn("group/node-status relative", className)}>
        <StatusAnnouncer label={statusLabel} />
        {children}
        {variant === "overlay" && status === "loading" && (
          <div className="absolute inset-0 z-30 flex animate-in items-center justify-center rounded-[inherit] bg-background/60 backdrop-blur-xs transition-opacity duration-150 fade-in">
            <Loader2Icon className="size-5 animate-spin text-blue-600 dark:text-sky-400" />
          </div>
        )}
      </div>
    </NodeStatusContext.Provider>
  )
}

/**
 * Overlay loading indicator: dim + blurred backdrop with a centered spinner.
 * Maintained for backward compatibility.
 */
export const SpinnerLoadingIndicator = ({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) => {
  return (
    <NodeStatusIndicator
      className={className}
      status="loading"
      variant="overlay"
    >
      {children}
    </NodeStatusIndicator>
  )
}

/**
 * Border loading indicator: delegates to NodeStatusIndicator with variant="border".
 * Maintained for backward compatibility.
 */
export const BorderLoadingIndicator = ({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) => {
  return (
    <NodeStatusIndicator
      className={className}
      status="loading"
      variant="border"
    >
      {children}
    </NodeStatusIndicator>
  )
}

/**
 * Visually hidden live-region that announces status changes to screen readers.
 * Rendered alongside visual indicators so the announcement is tied to the node.
 */
const StatusAnnouncer = ({ label }: { label: string | undefined }) =>
  label ? (
    <span aria-live="polite" className="sr-only" role="status">
      {label}
    </span>
  ) : null
