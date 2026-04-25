import { ImageResponse } from "next/og"

// Apple touch icon at 180×180. Same design language as `/icon` — rounded
// square, neutral-800 bg, white "E". iOS uses this when a user adds the
// site to their home screen.
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
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
          fontSize: 120,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          borderRadius: 38, // ~iOS icon corner curvature
        }}
      >
        E
      </div>
    ),
    { ...size },
  )
}
