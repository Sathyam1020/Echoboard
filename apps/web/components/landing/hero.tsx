import Link from "next/link"
import { ChevronUp } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { FadeIn } from "./fade-in"

const POSTS = [
  {
    title: "Slack integration for notifications",
    description:
      "Pipe new posts into a channel so the team sees them without opening the dashboard.",
    votes: 183,
    status: "progress" as const,
    statusLabel: "In progress",
    mrr: "$12,400/mo",
  },
  {
    title: "Custom domain support",
    description:
      "Host the board at feedback.ourcompany.com instead of *.echoboard.app",
    votes: 142,
    status: "planned" as const,
    statusLabel: "Planned",
    mrr: "$8,200/mo",
  },
  {
    title: "Bulk-merge duplicate posts",
    description:
      "Merge duplicate ideas and combine all votes into one request.",
    votes: 95,
    status: "review" as const,
    statusLabel: "Under review",
    mrr: "$4,200/mo",
  },
  {
    title: "Roadmap embed for marketing sites",
    description:
      "Drop an iframe roadmap view into our /product page without auth friction.",
    votes: 71,
    status: "review" as const,
    statusLabel: "Under review",
    mrr: "$2,800/mo",
  },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-2 md:items-center md:gap-10">
        <FadeIn>
          <p className="text-xs tracking-widest text-muted-foreground/60 uppercase">
            For SaaS teams tired of paying per tracked user
          </p>
          {/* Deliberate one-off: the hero headline is the only semibold on the site. */}
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Know what to build next — and who&apos;s asking for it
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Collect feature requests, let users vote, and see the real revenue
            behind every request. Free for unlimited users. No tracked-user
            pricing, ever.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="px-5 shadow-none">
              <Link href="/signup">Start free →</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-lg border border-border shadow-none"
            >
              <a href="#demo">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/60">
            Free forever for 1 board · No credit card · Set up in{" "}
            <span className="font-mono tabular-nums">2</span> minutes
          </p>
        </FadeIn>

        <FadeIn delay={120}>
          <HeroMockup />
        </FadeIn>
      </div>
    </section>
  )
}

function HeroMockup() {
  return (
    <div className="relative">
      <div
        className="-rotate-1 rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
        aria-hidden="true"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="filter-pill">Most voted</span>
          <span className="filter-pill filter-active">By MRR</span>
          <span className="filter-pill">Newest</span>
        </div>
        <div className="flex flex-col gap-2">
          {POSTS.map((p) => (
            <article key={p.title} className="feedback-card !gap-4">
              <div className="vote-btn">
                <ChevronUp className="size-4" />
                <span className="font-mono tabular-nums">{p.votes}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-foreground">
                  {p.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-[13px] leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/80">
                  <span
                    className={cn(
                      "status-badge !text-[11px]",
                      `status-${p.status}`,
                    )}
                  >
                    {p.statusLabel}
                  </span>
                  <span className="mrr-tag" data-mono>
                    {p.mrr}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 -bottom-4 h-24 rounded-b-xl bg-gradient-to-b from-transparent to-background" />
    </div>
  )
}
