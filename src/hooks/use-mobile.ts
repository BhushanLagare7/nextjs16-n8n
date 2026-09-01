import * as React from "react"

// Breakpoint (in px) below which the layout is considered "mobile".
const MOBILE_BREAKPOINT = 768

/**
 * useIsMobile
 * Reactively tracks whether the viewport width is below the mobile
 * breakpoint, using a media query listener via useSyncExternalStore.
 *
 * @returns true if viewport width < MOBILE_BREAKPOINT, false otherwise.
 *          Defaults to false during SSR (server snapshot).
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    // Subscribe: listen for media query changes.
    (onChange) => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    // Client snapshot: current viewport width check.
    () => window.innerWidth < MOBILE_BREAKPOINT,
    // Server snapshot: assume non-mobile during SSR.
    () => false
  )
}
