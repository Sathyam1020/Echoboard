import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { SITE_NAME } from "@/lib/seo"

// Catches missing slugs under any (marketing) route — alternatives,
// comparisons, use cases, blog posts that don't exist. Renders inside
// the marketing layout so users still get the header/footer chrome.
export default function MarketingNotFound() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        404
      </div>
      <h1 className="max-w-xl text-[28px] font-medium leading-tight -tracking-[0.015em] sm:text-[32px]">
        We couldn't find that page
      </h1>
      <p className="max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
        The link may be old, mistyped, or pointing at content we haven't
        published yet. Try one of these instead.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-[13.5px] font-medium text-background transition-colors hover:bg-foreground/90"
        >
          {SITE_NAME} home
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
        <Link
          href="/alternatives"
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-[13.5px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          Alternatives
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-[13.5px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          Blog
        </Link>
      </div>
    </div>
  )
}
