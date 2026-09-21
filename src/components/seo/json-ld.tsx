import { siteConfig } from "@/config/site"

interface JsonLdProps {
  data: Record<string, unknown>
}

/**
 * Server component that outputs XSS-safe JSON-LD structured data.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
      type="application/ld+json"
    />
  )
}

/**
 * Generates Schema.org WebSite structured data.
 */
export function getWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logos/logo.svg`,
      },
    },
  }
}

/**
 * Generates Schema.org WebApplication structured data.
 */
export function getWebApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Visual node graph automation canvas",
      "Durable background workflow execution",
      "Multi-provider AI model orchestration (OpenAI, Anthropic, Gemini)",
      "Real-time event streaming and webhook triggers",
      "Secure credential vault and OAuth management",
    ],
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
  }
}
