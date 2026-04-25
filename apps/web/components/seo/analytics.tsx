import { SITE_HOST } from "@/lib/seo"

// Plausible analytics — privacy-friendly, ~1KB script, no cookies, no
// banner needed. Only renders in production so dev pageviews don't pollute
// stats.
//
// `data-domain` must match the domain configured in the Plausible
// dashboard. We derive it from `NEXT_PUBLIC_SITE_URL` so a domain swap is
// a one-env-var change.
export function Analytics() {
  if (process.env.NODE_ENV !== "production") return null

  return (
    <script
      defer
      data-domain={SITE_HOST}
      src="https://plausible.io/js/script.js"
    />
  )
}
