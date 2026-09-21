import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

/**
 * Dynamic sitemap generation for public discoverable routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteConfig.url}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/signup`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
