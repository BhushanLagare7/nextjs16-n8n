"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  CreditCardIcon,
  FolderOpenIcon,
  HistoryIcon,
  KeyIcon,
  LogOutIcon,
  StarIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useHasActiveSubscription } from "@/features/subscriptions/hooks/use-subscription"
import { authClient } from "@/lib/auth-client"

import { NodemationLogo } from "./logos"

// Navigation menu structure, grouped by section
const menuItems = [
  {
    title: "Main",
    items: [
      {
        title: "Workflows",
        icon: FolderOpenIcon,
        url: "/workflows",
      },
      {
        title: "Credentials",
        icon: KeyIcon,
        url: "/credentials",
      },
      {
        title: "Executions",
        icon: HistoryIcon,
        url: "/executions",
      },
    ],
  },
]

/**
 * Main application sidebar with navigation, branding, and user actions.
 * Includes subscription upgrade prompt, billing portal access, and sign out.
 */
export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { hasActiveSubscription, isLoading } = useHasActiveSubscription()

  return (
    <Sidebar collapsible="icon">
      {/* Logo/brand section */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-10 gap-x-4 px-4">
              <Link href="/" prefetch>
                <NodemationLogo className="size-4" />
                <span className="text-sm font-semibold">Nodemation</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation menu items */}
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="h-10 gap-x-4 px-4"
                      // Highlight active route (exact match for root, prefix match otherwise)
                      isActive={
                        item.url === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.url)
                      }
                      tooltip={item.title}
                    >
                      <Link href={item.url} prefetch>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer actions: upgrade, billing, sign out */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Only show upgrade prompt if user lacks an active subscription */}
            {!hasActiveSubscription && !isLoading && (
              <SidebarMenuButton
                className="h-10 gap-x-4 px-4"
                tooltip="Upgrade to Pro"
                onClick={() => authClient.checkout({ slug: "pro" })}
              >
                <StarIcon className="size-4" />
                <span>Upgrade to Pro</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-10 gap-x-4 px-4"
              tooltip="Billing Portal"
              onClick={() => authClient.customer.portal()}
            >
              <CreditCardIcon className="size-4" />
              <span>Billing Portal</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-10 gap-x-4 px-4"
              tooltip="Sign out"
              // Sign out and redirect to login on success
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/login")
                    },
                  },
                })
              }
            >
              <LogOutIcon className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
