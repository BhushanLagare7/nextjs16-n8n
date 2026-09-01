import { cn } from "@/lib/utils"

/**
 * Skeleton
 * A simple pulsing placeholder block used while content is loading.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      data-slot="skeleton"
      {...props}
    />
  )
}

export { Skeleton }
