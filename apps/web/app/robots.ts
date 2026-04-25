import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/lib/seo"

// Public-facing crawl policy. Indexable by default; the dashboard,
// onboarding, widget iframe, auth, and API surfaces are blocked because
// they require auth and don't represent user-relevant search results.
//
// Next App Router auto-serves this at `/robots.txt`.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/onboarding/",
          "/widget/",
          "/signin",
          "/signup",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  }
}
