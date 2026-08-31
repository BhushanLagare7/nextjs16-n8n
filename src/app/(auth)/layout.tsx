import { AuthLayout as AuthLayoutComponent } from "@/features/auth/components/auth-layout"

/**
 * Layout wrapper for the auth route group.
 * Bridges Next.js routing with the feature-specific AuthLayout component.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthLayoutComponent>{children}</AuthLayoutComponent>
}
