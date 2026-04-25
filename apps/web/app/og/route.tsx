import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

import { SITE_NAME } from "@/lib/seo"

// Dynamic per-page Open Graph image. Each marketing/pSEO page references
// this in its `generateMetadata` like:
//
//   openGraph: {
//     images: [`/og?title=${encodeURIComponent(title)}&type=alternative`]
//   }
//
// Query params:
//   - title:       string, required. Truncates to ~80 chars visually.
//   - description: string, optional secondary line.
//   - type:        "blog" | "alternative" | "compare" | "use-case" | "board"
//                  Renders as a small badge top-right so the image's purpose
//                  is legible at a glance in shared previews.
//
// Force the node runtime — edge runtime + ImageResponse can be flaky on
// some Vercel regions and we don't need the latency edge buys for social
// crawler traffic.
export const runtime = "nodejs"

const TYPE_LABELS: Record<string, string> = {
  blog: "Blog",
  alternative: "Alternative",
  compare: "Compare",
  "use-case": "Use Case",
  board: "Feedback Board",
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get("title") ?? SITE_NAME).slice(0, 120)
  const description = searchParams.get("description")?.slice(0, 200) ?? ""
  const typeKey = searchParams.get("type") ?? ""
  const typeLabel = TYPE_LABELS[typeKey]

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#fafaf9",
          color: "#262626",
        }}
      >
        {/* Top row: brand mark on the left, optional type badge on the right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#262626",
                color: "white",
                fontSize: 30,
                fontWeight: 500,
                borderRadius: 10,
              }}
            >
              E
            </div>
            <div style={{ fontSize: 28, fontWeight: 500 }}>{SITE_NAME}</div>
          </div>
          {typeLabel ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                fontSize: 18,
                fontWeight: 500,
                color: "#525252",
                background: "white",
                border: "1px solid #e5e5e5",
                borderRadius: 999,
              }}
            >
              {typeLabel}
            </div>
          ) : null}
        </div>

        {/* Body: title + optional description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                fontSize: 28,
                color: "#737373",
                lineHeight: 1.4,
                maxWidth: 1000,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
