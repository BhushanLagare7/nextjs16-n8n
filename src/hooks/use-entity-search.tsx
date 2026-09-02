import { useEffect, useState } from "react"

import { PAGINATION } from "@/config/constants"

interface UseEntitySearchProps<
  T extends {
    search: string
    page: number
  },
> {
  params: T
  setParams: (params: T) => void | Promise<unknown>
  debounceMs?: number
}

/**
 * Manages a debounced search input backed by URL/query-state params.
 *
 * - Keeps a local input value for instant UI feedback.
 * - Syncs `localSearch` -> `params.search` after `debounceMs`, resetting
 *   pagination to the first page whenever the search term changes.
 * - Clearing the input (empty string) updates params immediately, skipping
 *   the debounce.
 * - Syncs `params.search` -> `localSearch` when it changes externally
 *   (e.g. browser back/forward navigation).
 */
export function useEntitySearch<
  T extends {
    search: string
    page: number
  },
>({ params, setParams, debounceMs = 500 }: UseEntitySearchProps<T>) {
  const [prevSearch, setPrevSearch] = useState(params.search)
  const [localSearch, setLocalSearch] = useState(params.search)

  // Detect external changes to params.search (e.g. navigation) and
  // resync local state without triggering the debounce effect below.
  if (prevSearch !== params.search) {
    setPrevSearch(params.search)
    setLocalSearch(params.search)
  }

  useEffect(() => {
    // Clearing the search should apply immediately, no debounce
    if (localSearch === "" && params.search !== "") {
      setParams({
        ...params,
        search: "",
        page: PAGINATION.DEFAULT_PAGE,
      })
      return
    }

    // Debounce non-empty search updates
    const timer = setTimeout(() => {
      if (localSearch !== params.search) {
        setParams({
          ...params,
          search: localSearch,
          page: PAGINATION.DEFAULT_PAGE,
        })
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localSearch, params, setParams, debounceMs])

  return {
    searchValue: localSearch,
    onSearchChange: setLocalSearch,
  }
}
