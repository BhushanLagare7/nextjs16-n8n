import Link from "next/link"

import { PlusIcon } from "lucide-react"

import { Button } from "./ui/button"

type EntityHeaderProps = {
  title: string
  description?: string
  newButtonLabel: string
  disabled?: boolean
  isCreating?: boolean
} &
  // Either provide a click handler (e.g. mutation) OR a link href, not both
  (
    | { onNew: () => void; newButtonHref?: never }
    | { newButtonHref: string; onNew?: never }
    | { onNew?: never; newButtonHref?: never }
  )

/**
 * Generic header for entity list pages, with a title/description
 * and a "new" action rendered as either a button (onNew) or a link (newButtonHref)
 */
export function EntityHeader({
  title,
  description,
  onNew,
  newButtonHref,
  newButtonLabel,
  disabled,
  isCreating,
}: EntityHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-x-4">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
        {description && (
          <p className="text-xs text-muted-foreground md:text-sm">
            {description}
          </p>
        )}
      </div>
      {/* Render as a button when a click handler is provided */}
      {onNew && !newButtonHref && (
        <Button disabled={isCreating || disabled} size="sm" onClick={onNew}>
          <PlusIcon className="size-4" />
          {newButtonLabel}
        </Button>
      )}
      {/* Render as a link when an href is provided */}
      {newButtonHref && !onNew && (
        <Button asChild size="sm">
          <Link href={newButtonHref} prefetch>
            <PlusIcon className="size-4" />
            {newButtonLabel}
          </Link>
        </Button>
      )}
    </div>
  )
}

type EntityContainerProps = {
  children: React.ReactNode
  header?: React.ReactNode
  search?: React.ReactNode
  pagination?: React.ReactNode
}

/**
 * Standard page layout for entity list pages:
 * header on top, optional search bar, content, and pagination at the bottom
 */
export function EntityContainer({
  children,
  header,
  search,
  pagination,
}: EntityContainerProps) {
  return (
    <div className="h-full p-4 md:px-10 md:py-6">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-y-8">
        {header}
        <div className="flex h-full flex-col gap-y-4">
          {search}
          {children}
        </div>
        {pagination}
      </div>
    </div>
  )
}
