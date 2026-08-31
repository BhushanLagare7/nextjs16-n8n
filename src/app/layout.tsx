import "./globals.css"

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
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
      <body>
        <ThemeProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
