import { ImageResponse } from "next/og"

import { siteConfig } from "@/config/site"

export const runtime = "nodejs"

export const alt = siteConfig.title
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

/**
 * Dynamic OpenGraph image generator using next/og ImageResponse.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        backgroundColor: "#09090b",
        backgroundImage:
          "radial-gradient(circle at 25px 25px, #27272a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #18181b 2%, transparent 0%)",
        backgroundSize: "50px 50px",
        padding: "80px",
        fontFamily: "sans-serif",
        color: "#fafafa",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
        <span
          style={{
            fontSize: "36px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#ffffff",
          }}
        >
          {siteConfig.name}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "960px",
        }}
      >
        <div
          style={{
            fontSize: "60px",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#ffffff",
          }}
        >
          Visual Workflow Automation Platform
        </div>
        <div
          style={{
            fontSize: "26px",
            lineHeight: 1.4,
            color: "#a1a1aa",
          }}
        >
          Build event-driven background workflows with durable execution,
          multi-model AI orchestration, and visual node graphs.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
          borderTop: "1px solid #27272a",
          width: "100%",
          paddingTop: "32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#60a5fa",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          Next.js 16
        </div>
        <div style={{ color: "#52525b" }}>•</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#c084fc",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          React 19
        </div>
        <div style={{ color: "#52525b" }}>•</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#4ade80",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          Inngest v4
        </div>
        <div style={{ color: "#52525b" }}>•</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#fbbf24",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          Prisma Next
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  )
}
