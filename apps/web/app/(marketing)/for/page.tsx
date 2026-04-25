import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { CtaSection } from "@/components/marketing/cta-section"
import { getAllUseCases, getUseCaseIcon } from "@/content/use-cases"
import { absoluteUrl, SITE_NAME } from "@/lib/seo"

const TITLE = `${SITE_NAME} for every team`
const DESCRIPTION =
  "EchoBoard adapts to how you collect feedback — whether you're a SaaS startup, a developer tool, an e-commerce brand, or an open source maintainer."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/for") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/for"),
    images: [
      {
        url: absoluteUrl(
          `/og?title=${encodeURIComponent(TITLE)}&description=${encodeURIComponent(DESCRIPTION)}&type=use-case`,
        ),
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}

export default function UseCaseIndexPage() {
  const useCases = getAllUseCases()

  return (
    <div className="flex flex-col gap-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Use Cases" },
        ]}
      />

      <header className="flex flex-col gap-3">
        <h1 className="text-[36px] font-medium leading-tight -tracking-[0.02em] sm:text-[44px]">
          {SITE_NAME} for every team
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
          The same product reframed for the way your team collects feedback.
          Pick the page that sounds like you.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {useCases.map((uc) => {
          const Icon = getUseCaseIcon(uc.slug)
          return (
            <Link
              key={uc.slug}
              href={`/for/${uc.slug}`}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
            >
              <div
                aria-hidden
                className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
              >
                <Icon className="size-4" />
              </div>
              <div className="text-[15px] font-medium">{uc.name}</div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {uc.description}
              </p>
              <div className="mt-auto flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
                {SITE_NAME} for {uc.name.toLowerCase()}
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
            </Link>
          )
        })}
      </section>

      <CtaSection variant="light" />
    </div>
  )
}
