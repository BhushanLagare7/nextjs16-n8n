import { type ComponentProps, forwardRef } from "react"

import { cn } from "@/lib/utils"

import {
  type NodeStatus,
  NodeStatusBadge,
  useNodeStatusContext,
} from "./node-status-indicator"

interface BaseNodeProps extends ComponentProps<"div"> {
  /** Current execution status; drives the node border, glow, and corner badge */
  status?: NodeStatus
}

/**
 * Status-driven border, ring, and subtle glow classes.
 * Carefully tailored for high visibility and contrast across light and dark mode.
 */
const statusStyles: Record<NodeStatus, string> = {
  initial: cn(
    "border-border transition-colors hover:border-muted-foreground/60",
    // Selected styles: applied by React Flow adding `.selected` to the ancestor node wrapper
    "in-[.selected]:border-primary in-[.selected]:ring-2 in-[.selected]:ring-primary/20",
    "[.react-flow\\_\\_node.selected_&]:border-primary [.react-flow\\_\\_node.selected_&]:ring-2 [.react-flow\\_\\_node.selected_&]:ring-primary/20"
  ),
  loading: cn(
    "border-blue-500/80 dark:border-sky-400/80",
    "ring-2 ring-blue-500/30 dark:ring-sky-400/35",
    "shadow-[0_0_12px_rgba(59,130,246,0.25)] dark:shadow-[0_0_16px_rgba(56,189,248,0.3)]",
    "animate-pulse"
  ),
  success: cn(
    "border-emerald-600/90 dark:border-emerald-400/90",
    "ring-2 ring-emerald-500/25 dark:ring-emerald-400/30",
    "shadow-[0_0_10px_rgba(16,185,129,0.2)] dark:shadow-[0_0_14px_rgba(52,211,153,0.25)]"
  ),
  error: cn(
    "border-rose-600/90 dark:border-rose-400/90",
    "ring-2 ring-rose-500/25 dark:ring-rose-400/30",
    "shadow-[0_0_10px_rgba(225,29,72,0.2)] dark:shadow-[0_0_14px_rgba(244,63,94,0.25)]"
  ),
}

/**
 * Root container for custom workflow nodes.
 * Provides card styling, hover ring, and status states driven by realtime execution status.
 *
 * A polished status badge is rendered at the bottom-right corner when active.
 */
export const BaseNode = forwardRef<HTMLDivElement, BaseNodeProps>(
  ({ className, status: statusProp, ...props }, ref) => {
    const context = useNodeStatusContext()
    const status = statusProp ?? context?.status ?? "initial"

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-md border bg-card text-card-foreground transition-all duration-200 hover:bg-accent",
          statusStyles[status],
          className
        )}
        tabIndex={0}
        {...props}
      >
        {props.children}
        <NodeStatusBadge status={status} />
      </div>
    )
  }
)
BaseNode.displayName = "BaseNode"

/**
 * Container for a consistent header layout inside `<BaseNode />`.
 */
export const BaseNodeHeader = forwardRef<HTMLElement, ComponentProps<"header">>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "mx-0 my-0 -mb-1 flex flex-row items-center justify-between gap-2 px-3 py-2",
        className
      )}
      {...props}
    />
  )
)
BaseNodeHeader.displayName = "BaseNodeHeader"

/**
 * Title text for the node header. Non-selectable for a native application feel.
 */
export const BaseNodeHeaderTitle = forwardRef<
  HTMLHeadingElement,
  ComponentProps<"h3">
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("user-select-none flex-1 font-semibold", className)}
    data-slot="base-node-title"
    {...props}
  />
))
BaseNodeHeaderTitle.displayName = "BaseNodeHeaderTitle"

/**
 * Padded body slot for the node's main content.
 */
export const BaseNodeContent = forwardRef<
  HTMLDivElement,
  ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-y-2 p-3", className)}
    data-slot="base-node-content"
    {...props}
  />
))
BaseNodeContent.displayName = "BaseNodeContent"

/**
 * Bordered footer slot, typically used for node actions or status indicators.
 */
export const BaseNodeFooter = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center gap-y-2 border-t px-3 pt-2 pb-3",
        className
      )}
      data-slot="base-node-footer"
      {...props}
    />
  )
)
BaseNodeFooter.displayName = "BaseNodeFooter"
