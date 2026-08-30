import "./globals.css"

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { TRPCReactProvider } from "@/trpc/client"

export const metadata: Metadata = {
  title: "Nodemation",
  description: "Nodemation application built with Next.js and shadcn/ui",
}

// Sans-serif font, exposed as CSS variable for Tailwind
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

// Monospace font, exposed as CSS variable for Tailwind
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

/**
 * Root layout applied to every page.
 * Sets up fonts and wraps the app with the theme provider & TRPC provider.
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
      // Prevents hydration warnings caused by theme class mismatch on first render
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
