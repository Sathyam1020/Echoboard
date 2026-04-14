import { Check, ChevronUp } from "lucide-react"

import { FadeIn } from "./fade-in"

const BULLETS = [
  "Every vote shows the customer's MRR automatically.",
  "Sort your entire board by revenue impact, not just vote count.",
  "A request from 3 enterprise customers at $500/mo outweighs 50 free-tier votes.",
]

const TOP_VOTERS = [
  { name: "Acme Corp", mrr: "$12,400/mo" },
  { name: "Stark Labs", mrr: "$8,200/mo" },
  { name: "Wayne Enterprises", mrr: "$6,100/mo" },
  { name: "Initech", mrr: "$4,200/mo" },
]

export function MRRFeature() {
  return (
    <section className="border-y border-border bg-secondary px-6 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-2 md:items-center md:gap-12">
        <FadeIn>
          <h2 className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
            Stop building for the loudest users
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Connect Stripe in <span className="font-mono tabular-nums">30</span>{" "}
            seconds. See the revenue behind every feature request.
          </p>
          <ul className="mt-8 space-y-4">
            {BULLETS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="leading-relaxed text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </FadeIn>

        <FadeIn delay={120}>
          <MRRMockup />
        </FadeIn>
      </div>
    </section>
  )
}

function MRRMockup() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="vote-btn vote-active">
          <ChevronUp className="size-4" />
          <span className="font-mono tabular-nums">183</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-foreground">
            Slack integration for notifications
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">183</span> votes ·{" "}
            <span className="mrr-tag" data-mono>
              $47,200/mo total MRR
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          Top voters
        </p>
        <ul className="divide-y divide-border">
          {TOP_VOTERS.map((v) => (
            <li key={v.name} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="truncate text-foreground">{v.name}</span>
              <span className="mrr-tag ml-auto" data-mono>
                {v.mrr}
              </span>
              <Check className="size-3.5 text-primary" aria-hidden />
              <span className="text-xs text-muted-foreground">Voted</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          … and <span className="font-mono tabular-nums">179</span> more
        </p>
      </div>
    </div>
  )
}
