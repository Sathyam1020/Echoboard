import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { CtaSection } from "@/components/marketing/cta-section"
import {
  echoboard,
  getVerifiedCompetitors,
} from "@/content/alternatives"
import { absoluteUrl, SITE_NAME } from "@/lib/seo"

const TITLE = `${SITE_NAME} Alternatives — Compared`
const DESCRIPTION =
  "Side-by-side comparisons of EchoBoard against the most popular feedback tools. See features, pricing, and migration paths in one place."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/alternatives") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/alternatives"),
    images: [
      {
        url: absoluteUrl(
          `/og?title=${encodeURIComponent(TITLE)}&description=${encodeURIComponent(DESCRIPTION)}&type=alternative`,
        ),
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}

export default function AlternativesIndexPage() {
  const verified = getVerifiedCompetitors().filter((c) => c.slug !== "echoboard")

  return (
    <div className="flex flex-col gap-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Alternatives" },
        ]}
      />

      <header className="flex flex-col gap-3">
        <h1 className="text-[36px] font-medium leading-tight -tracking-[0.02em] sm:text-[44px]">
          Feedback tool alternatives, compared honestly
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
          We researched the most popular feedback management tools and put them
          side-by-side with EchoBoard. Pricing, features, what they're good at,
          where they fall short — no marketing fluff.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Featured
        </div>
        <h2 className="mt-2 text-[22px] font-medium -tracking-[0.01em] sm:text-[24px]">
          {echoboard.name} — flat pricing, unlimited users
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
          {echoboard.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-[13.5px] font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Start free
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-[13.5px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            See pricing
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[20px] font-medium -tracking-[0.01em] sm:text-[22px]">
          Compare against
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {verified.map((c) => (
            <Link
              key={c.slug}
              href={`/alternatives/${c.slug}`}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
            >
              <div className="flex items-center gap-3">
                <div
                  aria-hidden
                  className="grid size-9 place-items-center rounded-lg bg-muted text-[13px] font-medium uppercase text-foreground"
                >
                  {c.name.charAt(0)}
                </div>
                <div className="text-[15px] font-medium">{c.name}</div>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {c.description}
              </p>
              <div className="mt-auto flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
                {SITE_NAME} vs {c.name}
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CtaSection />
    </div>
  )
}
