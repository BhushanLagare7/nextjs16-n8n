import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Composable primitives for building "empty state" placeholders
// (e.g. no items in a list, no search results, etc.)

/** Root container for an empty state, centers content in the available space. */
function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-6 text-center text-balance text-card-foreground",
        className
      )}
      data-slot="empty"
      {...props}
    />
  )
}

/** Groups the icon/media and title at the top of the empty state. */
function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      data-slot="empty-header"
      {...props}
    />
  )
}

// "icon" variant wraps its content in a small rounded badge background,
// "default" renders the media as-is (e.g. custom illustration)
const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground ring-1 ring-border [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/** Icon/illustration slot for the empty state, styled by `variant`. */
function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      className={cn(emptyMediaVariants({ variant, className }))}
      data-slot="empty-icon"
      data-variant={variant}
      {...props}
    />
  )
}

/** Bold heading text for the empty state (e.g. "No items"). */
function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-sm font-medium tracking-tight text-foreground",
        className
      )}
      data-slot="empty-title"
      {...props}
    />
  )
}

/** Supporting description text below the title, supports inline links. */
function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      className={cn(
        "text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      data-slot="empty-description"
      {...props}
    />
  )
}

/** Container for call-to-action content (e.g. buttons) below the description. */
function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-sm text-balance",
        className
      )}
      data-slot="empty-content"
      {...props}
    />
  )
}

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
}
