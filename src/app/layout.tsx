import "./globals.css"

import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Provider } from "jotai"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import {
  getWebApplicationJsonLd,
  getWebSiteJsonLd,
  JsonLd,
} from "@/components/seo/json-ld"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { TRPCReactProvider } from "@/trpc/client"

/**
 * Separate Viewport export required by Next.js 14+ / 16.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  colorScheme: "dark light",
}

/**
 * Global metadata configuration.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,
  category: "technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  icons: {
    icon: "/logos/logo.svg",
    shortcut: "/favicon.ico",
    apple: "/logos/logo.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        <JsonLd data={getWebSiteJsonLd()} />
        <JsonLd data={getWebApplicationJsonLd()} />
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
