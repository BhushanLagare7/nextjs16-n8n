import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sentry Diagnostic",
  description: "Test Sentry for your Next.js app",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SentryExampleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
