import { SidebarTrigger } from "@/components/ui/sidebar"

/**
 * Top header bar with sidebar toggle button
 */
export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />
    </header>
  )
}
