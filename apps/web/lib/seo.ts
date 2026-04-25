// Single source of truth for the site's public origin and brand strings.
// Wired into root metadata, sitemap, robots, JSON-LD URLs, OG image
// generation, RSS feed, canonical links, and every absolute URL we render
// in marketing pages.
//
// Set `NEXT_PUBLIC_SITE_URL` in `.env.local` (or your hosting env) to the
// real domain in prod. The localhost fallback keeps `next build` and local
// dev working without forcing the env var.
const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

// Strip trailing slash so `${SITE_URL}${path}` never produces double-slashes.
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "")

// Hostname only — useful for analytics scripts (Plausible needs the bare
// domain, not the protocol or path).
export const SITE_HOST = (() => {
  try {
    return new URL(SITE_URL).host
  } catch {
    return "localhost:3000"
  }
})()

export const SITE_NAME = "EchoBoard"
export const SITE_TAGLINE = "Customer Feedback Made Simple"
export const SITE_DEFAULT_DESCRIPTION =
  "Collect user feedback, prioritize feature requests, and share your roadmap. The simpler, affordable alternative to Canny — free forever with unlimited users."

// Default keyword set used by the root layout. Page-level `generateMetadata`
// can pass its own `keywords` to override on a per-route basis.
export const SITE_DEFAULT_KEYWORDS = [
  "feedback tool",
  "feature request tracking",
  "canny alternative",
  "product roadmap",
  "changelog",
  "user feedback",
  "saas feedback",
  "public roadmap",
]

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path
  if (!path.startsWith("/")) return `${SITE_URL}/${path}`
  return `${SITE_URL}${path}`
}
