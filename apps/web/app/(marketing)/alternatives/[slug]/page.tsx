import {
  ArrowRight,
  Check,
  DollarSign,
  Globe,
  KeyRound,
  Layers,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ComparisonTable } from "@/components/marketing/comparison-table"
import { CtaSection } from "@/components/marketing/cta-section"
import { FaqAccordion } from "@/components/marketing/faq-accordion"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { PricingComparison } from "@/components/marketing/pricing-comparison"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import {
  JsonLd,
  softwareApplicationSchema,
} from "@/components/seo/json-ld"
import {
  echoboard,
  getCompetitor,
  getVerifiedCompetitors,
  type Competitor,
} from "@/content/alternatives"
import { absoluteUrl, SITE_NAME } from "@/lib/seo"

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return getVerifiedCompetitors()
    .filter((c) => c.slug !== "echoboard")
    .map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const competitor = getCompetitor(slug)
  if (!competitor) return {}

  const title = `${competitor.name} Alternative — ${SITE_NAME} vs ${competitor.name}`
  const description = `Compare ${competitor.name} and ${SITE_NAME} on pricing, features, and integrations. ${competitor.name === "Canny" ? "Flat-rate vs per-tracked-user pricing." : ""}`.trim()
  const path = `/alternatives/${competitor.slug}`

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
            `/og?title=${encodeURIComponent(`${SITE_NAME} vs ${competitor.name}`)}&description=${encodeURIComponent(description)}&type=alternative`,
          ),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

// Why-teams-switch icons cycle through this list. Decorative — the order
// doesn't carry meaning, just keeps the grid visually varied.
const SWITCH_ICONS = [DollarSign, Users, Zap, Globe, ShieldCheck, Rocket]

function buildSwitchReasons(competitor: Competitor) {
  // Map competitor cons → "why teams switch" reasons. Shape the language as
  // a positive about EchoBoard rather than just dunking on the competitor —
  // that's both fairer and reads better.
  const reasons: { title: string; description: string }[] = []

  if (!competitor.features.flatPricing) {
    reasons.push({
      title: "Flat pricing that doesn't punish growth",
      description: `${competitor.name} charges per tracked user — costs scale as your audience does. EchoBoard is free for unlimited users, with one flat $49/mo Pro tier.`,
    })
  }

  if (!competitor.features.anonymousPosting) {
    reasons.push({
      title: "No-login feedback in seconds",
      description: `${competitor.name} requires user accounts to post. EchoBoard's widget lets visitors submit feedback with just an email — friction-free.`,
    })
  }

  if (
    competitor.features.api &&
    competitor.pricingModel.toLowerCase().includes("per tracked")
  ) {
    reasons.push({
      title: "Core features without paywall gymnastics",
      description: `${competitor.name} gates API access, integrations, and webhooks behind their Pro tier. EchoBoard ships these in the base plan as they roll out.`,
    })
  } else {
    reasons.push({
      title: "Public roadmap and changelog included",
      description: `Every EchoBoard plan — including free — gets a public roadmap and changelog. No "Pro plan to make it visible" tax.`,
    })
  }

  reasons.push({
    title: "Built mobile-first",
    description:
      "Most feedback tools were built before mobile mattered and treat it as an afterthought. EchoBoard works the same on a phone as on a 27-inch monitor.",
  })

  reasons.push({
    title: "Predictable, transparent pricing",
    description: `EchoBoard pricing is one number, posted on the page. No "contact sales" tier, no annual minimums, no per-seat ladders.`,
  })

  return reasons.slice(0, 6).map((r, i) => ({
    icon: SWITCH_ICONS[i % SWITCH_ICONS.length]!,
    title: r.title,
    description: r.description,
  }))
}

const ECHOBOARD_DIFFERENTIATORS = [
  {
    icon: DollarSign,
    title: "Flat pricing forever",
    description:
      "$0 free, $49/mo Pro. Your bill doesn't change as your audience grows from 100 to 100,000.",
  },
  {
    icon: Users,
    title: "Unlimited users on free",
    description:
      "No tracked-user counter. Every voter, commenter, and submitter is free, always.",
  },
  {
    icon: MessageSquare,
    title: "No-login widget",
    description:
      "Drop in a script tag. Visitors submit feedback with just an email — no account required.",
  },
  {
    icon: Layers,
    title: "Boards, roadmap, changelog — together",
    description:
      "One workspace, three surfaces. Feedback flows from board to roadmap to changelog without manual sync.",
  },
  {
    icon: KeyRound,
    title: "Open by default",
    description:
      "Public boards work without making people sign up to vote. Optional auth for teams that need it.",
  },
  {
    icon: Rocket,
    title: "Ships fast",
    description:
      "We're a new tool. That means the roadmap moves — features in the comparison table marked 'Soon' are usually weeks, not quarters.",
  },
]

export default async function AlternativePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const competitor = getCompetitor(slug)
  if (!competitor) notFound()

  const switchReasons = buildSwitchReasons(competitor)
  const otherCompetitors = getVerifiedCompetitors().filter(
    (c) => c.slug !== "echoboard" && c.slug !== competitor.slug,
  )

  return (
    <div className="flex flex-col gap-14">
      <JsonLd data={softwareApplicationSchema()} />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Alternatives", href: "/alternatives" },
          { label: competitor.name },
        ]}
      />

      <header className="flex flex-col gap-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {SITE_NAME} vs {competitor.name}
        </div>
        <h1 className="max-w-3xl text-[36px] font-medium leading-tight -tracking-[0.02em] sm:text-[44px]">
          The {SITE_NAME} alternative to {competitor.name}: flat pricing,
          unlimited users
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
          {competitor.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-[13.5px] font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Try {SITE_NAME} free
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          <Link
            href={competitor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-[13.5px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            Visit {competitor.name}
          </Link>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            About {competitor.name}
          </div>
          <div className="mt-4 flex flex-col gap-4 text-[14px] leading-relaxed text-foreground/90">
            {competitor.longDescription.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border-soft pt-5 text-[13px]">
            <div>
              <dt className="text-muted-foreground">Founded</dt>
              <dd className="font-medium text-foreground">
                {competitor.founded ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Funding</dt>
              <dd className="font-medium text-foreground">
                {competitor.fundingStatus ?? "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Pricing model</dt>
              <dd className="font-medium text-foreground">
                {competitor.pricingModel}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Free plan</dt>
              <dd className="font-medium text-foreground">
                {competitor.freePlan}
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <Check className="size-3.5 text-foreground" strokeWidth={2.5} />
              Where {competitor.name} excels
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {competitor.pros.map((pro) => (
                <li
                  key={pro}
                  className="flex gap-2.5 text-[13.5px] leading-relaxed text-foreground/90"
                >
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-foreground"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <X className="size-3.5 text-muted-foreground" strokeWidth={2.5} />
              Where it falls short
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {competitor.cons.map((con) => (
                <li
                  key={con}
                  className="flex gap-2.5 text-[13.5px] leading-relaxed text-foreground/90"
                >
                  <X
                    className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-[26px] font-medium -tracking-[0.015em] sm:text-[30px]">
            Why teams switch from {competitor.name}
          </h2>
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            The reasons we hear most when people move from {competitor.name} to{" "}
            {SITE_NAME}.
          </p>
        </div>
        <FeatureGrid items={switchReasons} columns={3} />
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-[26px] font-medium -tracking-[0.015em] sm:text-[30px]">
            Feature comparison
          </h2>
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            Side-by-side on the features that matter for a feedback workflow.
          </p>
        </div>
        <ComparisonTable left={echoboard} right={competitor} />
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-[26px] font-medium -tracking-[0.015em] sm:text-[30px]">
            Pricing at different scales
          </h2>
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            What you'd actually pay as your audience grows.
          </p>
        </div>
        <PricingComparison competitor={competitor} />
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-[26px] font-medium -tracking-[0.015em] sm:text-[30px]">
            What makes {SITE_NAME} different
          </h2>
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            Six things you get with {SITE_NAME} that aren't standard elsewhere.
          </p>
        </div>
        <FeatureGrid items={ECHOBOARD_DIFFERENTIATORS} columns={3} />
      </section>

      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-[22px] font-medium -tracking-[0.015em] sm:text-[24px]">
          Migrating from {competitor.name} to {SITE_NAME}
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          Most teams move in under an hour. The hardest part is deciding to
          switch.
        </p>
        <ol className="mt-5 flex flex-col gap-4">
          {[
            {
              title: `Export from ${competitor.name}`,
              body: `${competitor.name} offers a CSV export of your posts and votes from their admin settings. Grab that file — it's the only thing you need to bring with you.`,
            },
            {
              title: `Create your ${SITE_NAME} workspace`,
              body: `Sign up free, name your workspace, and create your first board. The whole flow takes about two minutes.`,
            },
            {
              title: "Import your data",
              body: `Upload your CSV from ${competitor.name} in workspace settings. Posts and vote counts are preserved; voters get re-emailed an opt-in to follow their submissions on the new home.`,
            },
            {
              title: "Update your widget",
              body: `Swap your old embed snippet for the ${SITE_NAME} one. Same drop-in pattern — usually a one-line change.`,
            },
            {
              title: `Cancel ${competitor.name}`,
              body: `Once you've verified the import, downgrade or cancel your ${competitor.name} subscription. Most teams pause for a week to verify, then cut over fully.`,
            },
          ].map((step, i) => (
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
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {competitor.faqs.length > 0 ? (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-[26px] font-medium -tracking-[0.015em] sm:text-[30px]">
              Frequently asked questions
            </h2>
            <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
              Common questions about {competitor.name} and the move to{" "}
              {SITE_NAME}.
            </p>
          </div>
          <FaqAccordion faqs={competitor.faqs} />
        </section>
      ) : null}

      <CtaSection
        headline={`Stop paying ${competitor.name}'s per-user fees`}
        description={`Free forever for unlimited users. Set up in two minutes — no credit card.`}
      />

      {otherCompetitors.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-[18px] font-medium -tracking-[0.01em]">
            Other alternatives
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherCompetitors.map((c) => (
              <Link
                key={c.slug}
                href={`/alternatives/${c.slug}`}
                className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    aria-hidden
                    className="grid size-7 place-items-center rounded-md bg-muted text-[12px] font-medium uppercase text-foreground"
                  >
                    {c.name.charAt(0)}
                  </div>
                  <div className="text-[13.5px] font-medium">
                    {SITE_NAME} vs {c.name}
                  </div>
                </div>
                <ArrowRight
                  className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
