import { AppHeader } from "@/components/app-header"

interface RestLayoutProps {
  children: React.ReactNode
}

/**
 * Generic layout with a header, used for non-dashboard pages
 */
export default function RestLayout({ children }: RestLayoutProps) {
  return (
    <>
      <AppHeader />
      <main className="flex-1">{children}</main>
    </>
  )
}
