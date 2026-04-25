import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { CtaSection } from "@/components/marketing/cta-section"
import { echoboard, getCompetitor } from "@/content/alternatives"
import { getVerifiedComparisons } from "@/content/comparisons"
import { absoluteUrl, SITE_NAME } from "@/lib/seo"

const TITLE = `${SITE_NAME} comparisons`
const DESCRIPTION =
  "Side-by-side feedback tool comparisons. Pricing, features, and the trade-offs between every popular feedback management option."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/compare") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/compare"),
    images: [
      {
        url: absoluteUrl(
          `/og?title=${encodeURIComponent(TITLE)}&description=${encodeURIComponent(DESCRIPTION)}&type=compare`,
        ),
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}

export default function CompareIndexPage() {
  const comparisons = getVerifiedComparisons()

  return (
    <div className="flex flex-col gap-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Compare" },
        ]}
      />

      <header className="flex flex-col gap-3">
        <h1 className="text-[36px] font-medium leading-tight -tracking-[0.02em] sm:text-[44px]">
          Compare feedback tools, side by side
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
          Pick two tools and see exactly how they differ — pricing tiers, feature
          coverage, integration support, and the trade-offs that actually matter.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-[18px] font-medium -tracking-[0.01em]">
          Featured comparisons
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((c) => {
            const left =
              c.leftSlug === "echoboard" ? echoboard : getCompetitor(c.leftSlug)
            const right =
              c.rightSlug === "echoboard"
                ? echoboard
                : getCompetitor(c.rightSlug)
            if (!left || !right) return null
            return (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
              >
                <div className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
                  <span>{left.name}</span>
                  <span className="text-muted-foreground/50">vs</span>
                  <span>{right.name}</span>
                </div>
                <div className="text-[15px] font-medium">
                  {left.name} vs {right.name}
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {c.verdict.bottomLine}
                </p>
                <div className="mt-auto flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
                  Read comparison
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <CtaSection variant="light" />
    </div>
  )
}
