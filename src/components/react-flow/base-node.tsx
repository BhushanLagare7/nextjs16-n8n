import { type ComponentProps, forwardRef } from "react"

import { cn } from "@/lib/utils"

/**
 * Root container for custom workflow nodes.
 * Provides card styling, hover ring, and selected states driven by React Flow wrapper classes.
 */
export const BaseNode = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-md border bg-card text-card-foreground",
        "hover:ring-1",
        // React Flow displays node elements inside a wrapper with `.react-flow__node`.
        // When selected, `.selected` is added to that element.
        // We support Tailwind v4 `in-[.selected]` and the ancestor selector fallback.
        "in-[.selected]:border-muted-foreground in-[.selected]:shadow-lg",
        "[.react-flow\\_\\_node.selected_&]:border-muted-foreground [.react-flow\\_\\_node.selected_&]:shadow-lg",
        className
      )}
      tabIndex={0}
      {...props}
    />
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
