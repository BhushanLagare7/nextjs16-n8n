/**
 * Global site metadata and SEO configuration.
 */
export const siteConfig = {
  name: "Nodemation",
  title: "Nodemation — Visual Workflow Automation Platform",
  shortTitle: "Nodemation",
  description:
    "Visual workflow automation platform inspired by n8n. Design node graphs on a canvas and execute durable, AI-orchestrated background workflows with Next.js 16 and Inngest.",
  url:
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://nextjs16-n8n.vercel.app"),
  ogImage: "/og-image.png",
  keywords: [
    "workflow automation",
    "node graph",
    "visual automation",
    "n8n alternative",
    "Next.js 16",
    "React 19",
    "Inngest v4",
    "background jobs",
    "durable execution",
    "AI orchestration",
    "DAG execution",
  ],
  author: {
    name: "Bhushan Lagare",
    url: "https://github.com/BhushanLagare7",
  },
  links: {
    github: "https://github.com/BhushanLagare7/nextjs16-n8n",
  },
} as const

export type SiteConfig = typeof siteConfig
