import type { Metadata } from "next"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

/**
 * Disallows search engine indexing across all authenticated dashboard routes.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Layout wrapper for dashboard pages with a persistent sidebar
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-accent/20">{children}</SidebarInset>
    </SidebarProvider>
  )
}
