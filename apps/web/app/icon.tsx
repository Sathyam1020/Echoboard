import { ImageResponse } from "next/og"

// Auto-generated 32×32 favicon, returned at `/icon`. Next.js plumbs this
// into the document `<link rel="icon">` automatically.
//
// Placeholder design: rounded square in `--foreground` (neutral-800) with
// a white "E" letter centered. Inter at the layout level is sufficient
// because ImageResponse falls back to system fonts when no font is
// supplied, and a single uppercase letter doesn't need typography
// finesse. Replace with a proper logo when one's available.
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#262626",
          color: "white",
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          borderRadius: 6,
        }}
      >
        E
      </div>
    ),
    { ...size },
  )
}
