import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { SITE_NAME } from "@/lib/seo"

// Global 404 — catches missing routes that don't fall inside a route
// group with its own `not-found.tsx` (the marketing group + public
// board flows). Plain landing-style page; no chrome that would imply
// a specific workspace context.
export default function GlobalNotFound() {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-6 py-12 text-foreground">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          404
        </div>
        <h1 className="text-[28px] font-medium leading-tight -tracking-[0.015em] sm:text-[32px]">
          We couldn&apos;t find that page
        </h1>
        <p className="max-w-sm text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
          The link may be old, mistyped, or pointing at content that has been
          removed.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-[13.5px] font-medium text-background transition-colors hover:bg-foreground/90"
        >
          {SITE_NAME} home
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
