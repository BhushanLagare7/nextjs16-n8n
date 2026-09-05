import { type ComponentProps, forwardRef } from "react"

import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { type NodeStatus } from "./node-status-indicator"

interface BaseNodeProps extends ComponentProps<"div"> {
  /** Current execution status; drives the corner status icon */
  status?: NodeStatus
}

/**
 * Root container for custom workflow nodes.
 * Provides card styling, hover ring, and selected states driven by React Flow wrapper classes.
 *
 * A tiny status icon is rendered in the bottom-right corner based on `status`.
 */
export const BaseNode = forwardRef<HTMLDivElement, BaseNodeProps>(
  ({ className, status, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-sm border border-muted-foreground bg-card text-card-foreground hover:bg-accent",
        // Selected styles: applied by React Flow adding `.selected` to the ancestor node wrapper
        "in-[.selected]:border-muted-foreground in-[.selected]:shadow-lg",
        "[.react-flow\\_\\_node.selected_&]:border-muted-foreground [.react-flow\\_\\_node.selected_&]:shadow-lg",
        className
      )}
      tabIndex={0}
      {...props}
    >
      {props.children}
      {/* Status indicator icons rendered as small badges in the bottom-right */}
      {status === "error" && (
        <XCircleIcon className="absolute right-0.5 bottom-0.5 size-2 stroke-3 text-red-600 dark:text-red-400" />
      )}
      {status === "success" && (
        <CheckCircle2Icon className="absolute right-0.5 bottom-0.5 size-2 stroke-3 text-emerald-600 dark:text-emerald-400" />
      )}
      {status === "loading" && (
        <Loader2Icon className="absolute -right-0.5 -bottom-0.5 size-2 animate-spin stroke-3 text-blue-600 dark:text-blue-400" />
      )}
    </div>
  )
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
