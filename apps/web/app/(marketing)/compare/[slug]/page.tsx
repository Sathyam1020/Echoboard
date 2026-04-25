import { ArrowRight, Check, Minus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ComparisonTable } from "@/components/marketing/comparison-table"
import { CtaSection } from "@/components/marketing/cta-section"
import { FaqAccordion } from "@/components/marketing/faq-accordion"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import {
  echoboard,
  getCompetitor,
  type Competitor,
} from "@/content/alternatives"
import {
  getComparison,
  getVerifiedComparisons,
  resolveComparison,
} from "@/content/comparisons"
import { absoluteUrl, SITE_NAME } from "@/lib/seo"

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return getVerifiedComparisons().map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const c = getComparison(slug)
  if (!c) return {}
  const resolved = resolveComparison(c)
  if (!resolved) return {}
  const { left, right } = resolved

  const title = `${left.name} vs ${right.name} — Compared`
  const description = c.verdict.bottomLine
  const path = `/compare/${c.slug}`

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      images: [
        {
          url: absoluteUrl(
            `/og?title=${encodeURIComponent(`${left.name} vs ${right.name}`)}&description=${encodeURIComponent(description)}&type=compare`,
          ),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

function VerdictColumn({
  side,
  bullets,
}: {
  side: Competitor
  bullets: string[]
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="grid size-8 place-items-center rounded-md bg-muted text-[13px] font-medium uppercase text-foreground"
        >
          {side.name.charAt(0)}
        </div>
        <div>
          <div className="text-[15px] font-medium">{side.name} wins on</div>
          <div className="text-[12px] text-muted-foreground">{side.pricing}</div>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5">
        {bullets.map((b) => (
          <li
            key={b}
            className="flex gap-2.5 text-[13.5px] leading-relaxed text-foreground/90"
          >
            <Check
              className="mt-0.5 size-3.5 shrink-0 text-foreground"
              strokeWidth={2.5}
              aria-hidden
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function ComparePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const c = getComparison(slug)
  if (!c) notFound()
  const resolved = resolveComparison(c)
  if (!resolved) notFound()
  const { left, right } = resolved

  const otherComparisons = getVerifiedComparisons().filter(
    (other) => other.slug !== c.slug,
  )

  return (
    <div className="flex flex-col gap-14">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Compare", href: "/compare" },
          { label: `${left.name} vs ${right.name}` },
        ]}
      />

      <header className="flex flex-col gap-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Comparison
        </div>
        <h1 className="max-w-3xl text-[36px] font-medium leading-tight -tracking-[0.02em] sm:text-[44px]">
          {left.name} vs {right.name}
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
          {c.verdict.bottomLine}
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <VerdictColumn side={left} bullets={c.verdict.leftWins} />
        <VerdictColumn side={right} bullets={c.verdict.rightWins} />
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-[26px] font-medium -tracking-[0.015em] sm:text-[30px]">
            Feature-by-feature
          </h2>
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            What each tool ships today.
          </p>
        </div>
        <ComparisonTable left={left} right={right} />
      </section>

      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-[22px] font-medium -tracking-[0.015em] sm:text-[24px]">
          Pricing snapshot
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {[left, right].map((side) => (
            <div key={side.slug} className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  aria-hidden
                  className="grid size-7 place-items-center rounded-md bg-muted text-[12px] font-medium uppercase text-foreground"
                >
                  {side.name.charAt(0)}
                </div>
                <div className="text-[14px] font-medium">{side.name}</div>
              </div>
              <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-[12.5px]">
                <dt className="col-span-1 text-muted-foreground">Pricing</dt>
                <dd className="col-span-2 font-medium text-foreground">
                  {side.pricing}
                </dd>
                <dt className="col-span-1 text-muted-foreground">Model</dt>
                <dd className="col-span-2 font-medium text-foreground">
                  {side.pricingModel}
                </dd>
                <dt className="col-span-1 text-muted-foreground">Free plan</dt>
                <dd className="col-span-2 font-medium text-foreground">
                  {side.freePlan}
                </dd>
                <dt className="col-span-1 text-muted-foreground">Best for</dt>
                <dd className="col-span-2 font-medium text-foreground">
                  {side.bestFor}
                </dd>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {c.faqs.length > 0 ? (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-[26px] font-medium -tracking-[0.015em] sm:text-[30px]">
              FAQ
            </h2>
            <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
              The questions teams ask before they switch.
            </p>
          </div>
          <FaqAccordion faqs={c.faqs} />
        </section>
      ) : null}

      <CtaSection
        headline={`Try ${SITE_NAME} alongside ${left.slug === "echoboard" ? right.name : left.name}`}
        description="Free forever for unlimited users. Set up in two minutes — no credit card."
      />

      {otherComparisons.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-[18px] font-medium -tracking-[0.01em]">
            More comparisons
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherComparisons.map((other) => {
              const otherLeft =
                other.leftSlug === "echoboard"
                  ? echoboard
                  : getCompetitor(other.leftSlug)
              const otherRight =
                other.rightSlug === "echoboard"
                  ? echoboard
                  : getCompetitor(other.rightSlug)
              if (!otherLeft || !otherRight) return null
              return (
                <Link
                  key={other.slug}
                  href={`/compare/${other.slug}`}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-center gap-2 text-[13.5px] font-medium">
                    <span>{otherLeft.name}</span>
                    <Minus
                      className="size-3 text-muted-foreground/50"
                      aria-hidden
                    />
                    <span>{otherRight.name}</span>
                  </div>
                  <ArrowRight
                    className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
