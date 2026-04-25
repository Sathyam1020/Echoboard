import { ArrowRight, Quote } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CtaSection } from "@/components/marketing/cta-section"
import { FaqAccordion } from "@/components/marketing/faq-accordion"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import {
  getAllUseCases,
  getUseCase,
  getUseCaseIcon,
} from "@/content/use-cases"
import { absoluteUrl, SITE_NAME } from "@/lib/seo"

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return getAllUseCases().map((uc) => ({ slug: uc.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const uc = getUseCase(slug)
  if (!uc) return {}

  const path = `/for/${uc.slug}`
  return {
    title: uc.headline,
    description: uc.description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: uc.headline,
      description: uc.description,
      url: absoluteUrl(path),
      images: [
        {
          url: absoluteUrl(
            `/og?title=${encodeURIComponent(uc.headline)}&description=${encodeURIComponent(uc.description)}&type=use-case`,
          ),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: uc.headline,
      description: uc.description,
    },
  }
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const uc = getUseCase(slug)
  if (!uc) notFound()

  const Icon = getUseCaseIcon(uc.slug)
  const otherUseCases = getAllUseCases().filter((other) => other.slug !== uc.slug)

  return (
    <div className="flex flex-col gap-14">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Use Cases", href: "/for" },
          { label: uc.name },
        ]}
      />

      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          <Icon className="size-3.5" aria-hidden />
          {SITE_NAME} for {uc.name.toLowerCase()}
        </div>
        <h1 className="max-w-3xl text-[36px] font-medium leading-tight -tracking-[0.02em] sm:text-[44px]">
          {uc.headline}
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
          {uc.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
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
      </header>

      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Who this is for
        </div>
        <p className="mt-3 text-[14.5px] leading-relaxed text-foreground/90">
          {uc.audience}
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-[26px] font-medium -tracking-[0.015em] sm:text-[30px]">
            Sound familiar?
          </h2>
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            The pain points we hear most from {uc.name.toLowerCase()}.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {uc.pains.map((pain) => (
            <li
              key={pain}
              className="flex gap-3 rounded-xl border border-border bg-card p-5"
            >
              <Quote
                className="mt-1 size-4 shrink-0 text-muted-foreground/60"
                aria-hidden
              />
              <p className="text-[13.5px] leading-relaxed text-foreground/90">
                {pain}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-[26px] font-medium -tracking-[0.015em] sm:text-[30px]">
            What helps
          </h2>
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            The {SITE_NAME} features that map directly to those pain points.
          </p>
        </div>
        <FeatureGrid items={uc.features} columns={3} />
      </section>

      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-[22px] font-medium -tracking-[0.015em] sm:text-[24px]">
          What it looks like in practice
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          The 3-step workflow most {uc.name.toLowerCase()} settle into within
          their first week.
        </p>
        <ol className="mt-5 flex flex-col gap-4">
          {uc.workflow.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <div
                aria-hidden
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-muted text-[12px] font-medium text-foreground"
              >
                {i + 1}
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[14px] font-medium">{step.title}</div>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {uc.faqs.length > 0 ? (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-[26px] font-medium -tracking-[0.015em] sm:text-[30px]">
              FAQ
            </h2>
            <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
              Common questions from {uc.name.toLowerCase()}.
            </p>
          </div>
          <FaqAccordion faqs={uc.faqs} />
        </section>
      ) : null}

      <CtaSection
        headline={uc.ctaHeadline}
        description={uc.ctaDescription}
      />

      {otherUseCases.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-[18px] font-medium -tracking-[0.01em]">
            Other use cases
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherUseCases.map((other) => {
              const OtherIcon = getUseCaseIcon(other.slug)
              return (
                <Link
                  key={other.slug}
                  href={`/for/${other.slug}`}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden
                      className="grid size-7 place-items-center rounded-md bg-muted text-foreground"
                    >
                      <OtherIcon className="size-3.5" />
                    </div>
                    <div className="text-[13.5px] font-medium">{other.name}</div>
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
