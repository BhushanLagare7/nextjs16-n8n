import { type ReactNode } from "react"

import { LoaderCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** Execution lifecycle status for a workflow node */
export type NodeStatus = "loading" | "success" | "error" | "initial"

/**
 * Visual style for the status indicator.
 * - `overlay`: dims the node and shows a centered spinner (loading only)
 * - `border`: paints an animated/colored border around the node
 */
export type NodeStatusVariant = "overlay" | "border"

export type NodeStatusIndicatorProps = {
  status?: NodeStatus
  variant?: NodeStatusVariant
  className?: string
  children: ReactNode
}

/**
 * Overlay loading indicator: dim + blurred backdrop with a centered ping/spinner.
 * Used when the loading state should visually block interaction with the node.
 */
export const SpinnerLoadingIndicator = ({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) => {
  return (
    <div className={cn("relative", className)}>
      <StatusBorder className="border-blue-600/40 dark:border-blue-400/40">
        {children}
      </StatusBorder>

      {/* Blurred backdrop covering the node */}
      <div className="absolute inset-0 z-50 rounded-[9px] bg-background/50 backdrop-blur-xs" />
      <div className="absolute inset-0 z-50">
        {/* Pulsing ring behind the spinner */}
        <span className="absolute top-[calc(50%-1.25rem)] left-[calc(50%-1.25rem)] inline-block size-10 animate-ping rounded-full bg-blue-600/20 dark:bg-blue-400/20" />

        <LoaderCircleIcon className="absolute top-[calc(50%-0.75rem)] left-[calc(50%-0.75rem)] size-6 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    </div>
  )
}

/**
 * Border loading indicator: a rotating conic-gradient painted just outside the node.
 * Lightweight and does not obscure the node content.
 */
export const BorderLoadingIndicator = ({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) => {
  return (
    <>
      <div className="absolute -top-px -left-px h-[calc(100%+2px)] w-[calc(100%+2px)]">
        {/* Local keyframes so the animation is self-contained to this component */}
        <style>
          {`
        @keyframes node-border-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .node-border-spinner {
          animation: node-border-spin 2s linear infinite;
          position: absolute;
          left: 50%;
          top: 50%;
          width: 140%;
          aspect-ratio: 1;
          transform-origin: center;
        }
      `}
        </style>
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-[9px]",
            className
          )}
        >
          {/* Conic gradient rotated to create the "chasing border" effect */}
          <div className="node-border-spinner rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,#2563eb_0deg,rgba(37,99,235,0)_360deg)] dark:bg-[conic-gradient(from_0deg_at_50%_50%,#60a5fa_0deg,rgba(96,165,250,0)_360deg)]" />
        </div>
      </div>
      {children}
    </>
  )
}

/**
 * Static colored border shown around a node (for success/error/idle-loading states).
 */
const StatusBorder = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return (
    <>
      <div
        className={cn(
          "absolute -top-px -left-px h-[calc(100%+2px)] w-[calc(100%+2px)] rounded-[9px] border-2",
          className
        )}
      />
      {children}
    </>
  )
}

/**
 * Wraps a node with the appropriate status visualization.
 * Falls through to just rendering children for `initial`/unknown statuses.
 */
const STATUS_LABELS: Record<Exclude<NodeStatus, "initial">, string> = {
  loading: "Loading",
  success: "Completed successfully",
  error: "Error occurred",
}

export const NodeStatusIndicator = ({
  status,
  variant = "border",
  className,
  children,
}: NodeStatusIndicatorProps) => {
  const statusLabel =
    status && status !== "initial" ? STATUS_LABELS[status] : undefined
  switch (status) {
    case "loading":
      // Pick between the two loading styles
      switch (variant) {
        case "overlay":
          return (
            <SpinnerLoadingIndicator className={className}>
              <StatusAnnouncer label={statusLabel} />
              {children}
            </SpinnerLoadingIndicator>
          )
        case "border":
          return (
            <BorderLoadingIndicator className={className}>
              <StatusAnnouncer label={statusLabel} />
              {children}
            </BorderLoadingIndicator>
          )
        default:
          return <>{children}</>
      }
    case "success":
      return (
        <StatusBorder
          className={cn(
            "border-emerald-600 dark:border-emerald-400",
            className
          )}
        >
          <StatusAnnouncer label={statusLabel} />
          {children}
        </StatusBorder>
      )
    case "error":
      return (
        <StatusBorder className={cn("border-destructive", className)}>
          <StatusAnnouncer label={statusLabel} />
          {children}
        </StatusBorder>
      )
    default:
      // `initial` or undefined: render children as-is
      return <>{children}</>
  }
}

/**
 * Visually hidden live-region that announces status changes to screen readers.
 * Rendered alongside visual indicators so the announcement is tied to the node.
 */
const StatusAnnouncer = ({ label }: { label: string | undefined }) =>
  label ? (
    <span
      aria-live="polite"
      className="sr-only"
      role="status"
    >
      {label}
    </span>
  ) : null
