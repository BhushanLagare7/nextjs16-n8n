import "./globals.css"

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Provider } from "jotai"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { TRPCReactProvider } from "@/trpc/client"

/**
 * Global metadata configuration.
 */
export const metadata: Metadata = {
  title: "Nodemation",
  description: "Nodemation application built with Next.js and shadcn/ui",
  icons: {
    icon: "/logos/logo.svg",
  },
}

// Fonts configured as CSS variables for Tailwind integration
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

/**
 * Root application layout. Sets up fonts, providers, and global UI elements.
 *
 * Provider order (outer -> inner):
 * ThemeProvider -> TooltipProvider -> TRPCReactProvider -> NuqsAdapter -> Jotai Provider -> children
 *
 * - ThemeProvider: light/dark/system theme handling
 * - TooltipProvider: shadcn/ui tooltip context (single instance for app)
 * - TRPCReactProvider: tRPC + React Query client
 * - NuqsAdapter: URL-synced state (query params)
 * - Jotai Provider: atom-based global state
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
      lang="en"
      // Suppresses hydration mismatches caused by browser extensions or dark-mode themes
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <TooltipProvider>
            <TRPCReactProvider>
              {/* Enables type-safe URL query state management via nuqs */}
              <NuqsAdapter>
                <Provider>{children}</Provider>
              </NuqsAdapter>
            </TRPCReactProvider>
            {/* Global toast notifications, rendered outside TRPC/nuqs scope */}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
