import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

/**
 * Dynamic robots.txt configuration for Next.js App Router.
 * Protects private workspace routes while indexing public landing and auth pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: [
          "/api/",
          "/monitoring/",
          "/workflows/",
          "/credentials/",
          "/executions/",
          "/sentry-example-page/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
