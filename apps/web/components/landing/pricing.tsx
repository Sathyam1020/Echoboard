import Link from "next/link"
import { Check } from "lucide-react"
import { type ReactNode } from "react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { FadeIn } from "./fade-in"

const FREE_FEATURES = [
  "Unlimited users",
  "Unlimited feedback",
  "1 board",
  "Public roadmap",
  "Changelog",
  "Embeddable widget",
  "Community support",
]

const PRO_FEATURES = [
  "Everything in Free, plus:",
  "Unlimited boards",
  "Custom domain",
  "Remove branding",
  "Stripe MRR voting",
  "Slack + Linear integration",
  "Priority support",
  "CSV import",
]

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <FadeIn>
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
              Simple pricing. No surprises.
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              No tracked users. No per-seat costs. Pay for features, not
              engagement.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-5 md:grid-cols-2">
          <FadeIn>
            <PricingCard
              tier="Free"
              price="$0"
              caption="Forever. No credit card."
              features={FREE_FEATURES}
              cta={
                <Button
                  asChild
                  variant="outline"
                  className="w-full shadow-none"
                >
                  <Link href="/signup">Start free →</Link>
                </Button>
              }
            />
          </FadeIn>

          <FadeIn delay={80}>
            <PricingCard
              tier="Pro"
              price="$29"
              priceSuffix="/mo"
              caption="Flat. Predictable. Done."
              features={PRO_FEATURES}
              highlight
              cta={
                <Button asChild className="w-full shadow-none">
                  <Link href="/signup">Start free, upgrade later →</Link>
                </Button>
              }
            />
          </FadeIn>
        </div>

        <FadeIn delay={160}>
          <div className="mt-10 rounded-lg border border-vote-active-border bg-accent/60 px-6 py-4 text-center text-sm text-accent-foreground">
            Teams with <span className="font-mono tabular-nums">1,000</span>{" "}
            users pay{" "}
            <span className="font-mono font-medium tabular-nums">$29/mo</span>{" "}
            with Echoboard vs{" "}
            <span className="font-mono font-medium tabular-nums">
              $275–579/mo
            </span>{" "}
            with Canny.
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

function PricingCard({
  tier,
  price,
  priceSuffix,
  caption,
  features,
  highlight,
  cta,
}: {
  tier: string
  price: string
  priceSuffix?: string
  caption: string
  features: string[]
  highlight?: boolean
  cta: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card p-6",
        highlight ? "border-2 border-primary" : "border-border",
      )}
    >
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-medium text-foreground">{tier}</p>
        {highlight && (
          <span className="mrr-tag" data-mono>
            Most popular
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-mono text-4xl font-medium tracking-tight tabular-nums">
          {price}
        </span>
        {priceSuffix && (
          <span className="text-sm text-muted-foreground">{priceSuffix}</span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>

      <ul className="mt-6 mb-6 flex flex-col gap-2.5 text-sm">
        {features.map((f) => {
          const isHeader = f.endsWith(":")
          return (
            <li
              key={f}
              className={cn(
                "flex items-start gap-2",
                isHeader
                  ? "mt-1 text-xs font-medium tracking-wider text-muted-foreground uppercase"
                  : "text-foreground",
              )}
            >
              {!isHeader && (
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
              )}
              <span className={cn(!isHeader && "leading-relaxed")}>
                {f.replace(/:$/, "")}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto">{cta}</div>
    </div>
  )
}
