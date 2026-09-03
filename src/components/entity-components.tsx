import Link from "next/link"

import {
  AlertTriangleIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PackageOpenIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty"
import { Input } from "./ui/input"

type EntityHeaderProps = {
  title: string
  description?: string
  newButtonLabel: string
  disabled?: boolean
  isCreating?: boolean
} &
  // Discriminated union: exactly one of onNew/newButtonHref may be provided
  // (or neither, in which case no "new" action is rendered)
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

interface EntitySearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/**
 * Controlled search input with a leading search icon,
 * used to filter entity lists.
 */
export function EntitySearch({
  value,
  onChange,
  placeholder = "Search",
}: EntitySearchProps) {
  return (
    <div className="relative ml-auto">
      <SearchIcon className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label={placeholder}
        className="max-w-[200px] border-border bg-background pl-8 shadow-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

interface EntityPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

/**
 * Simple previous/next pagination control with a page indicator.
 * Buttons are disabled at the first/last page or when `disabled` is true.
 */
export function EntityPagination({
  page,
  totalPages,
  onPageChange,
  disabled,
}: EntityPaginationProps) {
  return (
    <div className="flex w-full items-center justify-between gap-x-2">
      <div className="flex-1 text-sm text-muted-foreground">
        Page {page} of {totalPages || 1}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          disabled={page === 1 || disabled}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          disabled={page === totalPages || totalPages === 0 || disabled}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

interface StateViewProps {
  message?: string
}

/** Centered loading spinner with an optional message, fills parent height. */
export function LoadingView({ message }: StateViewProps) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-y-4">
      <Loader2Icon className="size-6 animate-spin text-primary" />
      {!!message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}

/** Centered error state with an optional message, fills parent height. */
export function ErrorView({ message }: StateViewProps) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-y-4">
      <AlertTriangleIcon className="size-6 text-primary" />
      {!!message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}

interface EmptyViewProps extends StateViewProps {
  title?: string
  onNew?: () => void
}

/** Empty state placeholder for entity lists, with optional "Add item" action. */
export function EmptyView({
  title = "No items",
  message,
  onNew,
}: EmptyViewProps) {
  return (
    <Empty className="border border-dashed border-border bg-card text-card-foreground">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageOpenIcon />
        </EmptyMedia>
      </EmptyHeader>
      <EmptyTitle>{title}</EmptyTitle>
      {!!message && <EmptyDescription>{message}</EmptyDescription>}
      {!!onNew && (
        <EmptyContent>
          <Button onClick={onNew}>Add item</Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

interface EntityListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  getKey?: (item: T, index: number) => string | number
  emptyView?: React.ReactNode
  className?: string
}

/**
 * Renders a list of entities, falling back to `emptyView` when there are
 * no items. Uses `getKey` for stable keys when provided, else array index.
 */
export function EntityList<T>({
  items,
  renderItem,
  getKey,
  emptyView,
  className,
}: EntityListProps<T>) {
  if (items.length === 0 && emptyView) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-sm">{emptyView}</div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-y-4", className)}>
      {items.map((item, index) => (
        <div key={getKey ? getKey(item, index) : index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}

interface EntityItemProps {
  href: string
  title: string
  subtitle?: React.ReactNode
  image?: React.ReactNode
  actions?: React.ReactNode
  onRemove?: () => void | Promise<void>
  isRemoving?: boolean
  className?: string
}

/**
 * Clickable card representing a single entity in a list, linking to its
 * detail page. Optionally shows custom actions and a delete option in a
 * dropdown menu.
 */
export function EntityItem({
  href,
  title,
  subtitle,
  image,
  actions,
  onRemove,
  isRemoving,
  className,
}: EntityItemProps) {
  const handleRemove = async (e: React.MouseEvent) => {
    // Prevent the surrounding Link from navigating when deleting
    e.preventDefault()
    e.stopPropagation()

    if (isRemoving) {
      return
    }

    if (onRemove) {
      await onRemove()
    }
  }

  return (
    <Link href={href} prefetch>
      <Card
        className={cn(
          "cursor-pointer p-4 shadow-none hover:shadow",
          isRemoving && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <CardContent className="flex flex-row items-center justify-between p-0">
          <div className="flex items-center gap-3">
            {image}
            <div>
              <CardTitle className="text-base font-medium">{title}</CardTitle>
              {!!subtitle && (
                <CardDescription className="text-xs">
                  {subtitle}
                </CardDescription>
              )}
            </div>
          </div>
          {(actions || onRemove) && (
            <div className="flex items-center gap-x-4">
              {actions}
              {onRemove && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {/* Stop propagation so opening the menu doesn't trigger the card link */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVerticalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem onClick={handleRemove}>
                      <TrashIcon className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
